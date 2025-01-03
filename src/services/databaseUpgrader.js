import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { imageDB, settingsDB, teamsDB } from '@/services/localforage.js';
import { useSettingsStore } from '@/stores/settings-store.js';
import logger from '@/services/logger.js';

const databaseUpgrader = () => {

    const { t } = useI18n();
    const $q = useQuasar();


    const dBVersions = [
        {
            version: 1,
            description: 'First database version',
            caption: t('databaseUpgrade.inProgress.caption', { version: '1' }),
            upgrade: async () => { }
        },
        {
            version: 6,
            description: 'Optimized database structure by moving images from messages to separate table.',
            caption: t('databaseUpgrade.inProgress.caption', { version: '6' }),
            upgrade: async () => upgradeToVersion6()
        },
        {
            version: 7,
            description: 'Added new OpenAI models.',
            caption: t('databaseUpgrade.inProgress.caption', { version: '7' }),
            upgrade: async () => upgradeToVersion7()
        },
        {
            version: 8,
            description: 'Removed OpenAI API parameter options from persistent storage.',
            caption: t('databaseUpgrade.inProgress.caption', { version: '8' }),
            upgrade: async () => upgradeToVersion8()
        }
    ];

    // =================================================================================================
    // Update latest database version here when needed
    // -------------------------------------------------------------------------------------------------
    const LATEST_DB_VERSION = 8;

    // =================================================================================================
    const getDBVersion = async () => parseInt(JSON.parse(await settingsDB.getItem('dBVersion')));
    const setDBVersion = async (version) => await settingsDB.setItem('dBVersion', JSON.stringify(version));

    const isUpgradeNeed = async () => {
        logger.log("[dbUpgrader] - Checking if database upgrade is needed...");
        let currentVersion = await getDBVersion();
        let isNeeded = currentVersion < LATEST_DB_VERSION ? true : false;
        logger.log(`[dbUpgrader] - Current version is ${currentVersion}. Latest version is ${LATEST_DB_VERSION}.`)
        logger.log(`[dbUpgrader] - Upgrade ${isNeeded ? "" : "not"} needed`);
        return isNeeded;
    }

    // Add new OpenAI models
    const upgradeToVersion7 = async () => {
        try {
            const settingsStore = useSettingsStore();
            
            if (!settingsStore.hasOwnProperty('modelOptions')) return;
            
            settingsStore.modelOptions.value = modelOptions;
            const modelOptions = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'];
            await settingsDB.setItem('modelOptions', JSON.stringify(modelOptions));
        } catch (error) {
            logger.error(`[dbUpgrader][v7] - Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // Clean up stuff that should not be persisted as states
    const upgradeToVersion8 = async () => {
        try {
            await settingsDB.removeItem('modelOptions');
        } catch (error) {
            logger.error(`[dbUpgrader][v8] - Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }
    // Upgrade to mitigate performance issues due to images being stored in message objects.
    // This upgrade moves images to a separate table, imageDB.
    const upgradeToVersion6 = async () => {

        try {
            // Get messages from persistent storage
            let messages = JSON.parse(await teamsDB.getItem('messages'));
            if (messages == null) {
                logger.error(`[dbUpgrader][v6] - Nothing to upgrade`);
                return;
            }

            for (let m = 0; m < messages.length; m++) {
                logger.log(`[dbUpgrader][v6] - Processing message: ${messages[m].timestamp}`);

                if (messages[m].object == 'image' &&
                    messages[m].hasOwnProperty('choices') &&
                    messages[m].choices.length > 0) {

                    for (let i = 0; i < messages[m].choices.length; i++) {
                        logger.log(`[dbUpgrader][v6] - [v6]:\tProcessing image: ${messages[m].choices[i].index}`);
                        if (messages[m].choices[i].content.startsWith('image')) {
                            logger.log(`[dbUpgrader][v6] - \t\tImage name: ${messages[m].choices[i].content}`);
                            // Check that image exists in imageDB
                            const image = await imageDB.getItem(messages[m].choices[i].content);
                            if (image != null) {
                                logger.log("[dbUpgrader][v6] - \t\tImage exists in imageDB.")
                            } else {
                                logger.log("[dbUpgrader][v6] - \t\tImage does not exist in imageDB. Removing reference from message.")
                                // Remove image reference from message
                                messages[m].choices.splice(i, 1);
                            }
                        } else if (messages[m].choices[i].content.startsWith('data:image')) {
                            // Found base64 image, move to imageDB
                            let imageName = `image-${messages[m].timestamp}-${messages[m].choices[i].index}`;
                            logger.log(`[dbUpgrader][v6] - \t\tFound base64 image. Moving to imageDB with imageName: ${imageName}`);

                            try {
                                // Create blob from base64 image and store it in imageDB
                                let response = await fetch(messages[m].choices[i].content);
                                let blob = await response.blob();
                                await imageDB.setItem(imageName, blob);

                                const testImage = await imageDB.getItem(imageName);
                                if (testImage != null) {
                                    // Update message with image name
                                    const newItem = { index: messages[m].choices[i].index, content: imageName };
                                    messages[m].choices.splice(i, 1, newItem);
                                } else {
                                    throw new Error("[dbUpgrader][v6] - Error when moving image: " + imageName);
                                }

                            } catch (error) {
                                logger.error(`[dbUpgrader][v6] - Store image error: ${JSON.stringify(error)}`);
                                throw error;
                            }
                        } else {
                            logger.log(`[dbUpgrader][v6] - \t\tUnexpected image reference. Removing from message. ${messages[m].choices[i].content}`)
                        }
                    }

                } else {
                    // No images in message, do nothing
                    logger.log(`[dbUpgrader][v6] - \tNo images in message. ${messages[m].timestamp}`);
                }
            }
            // Store the potentially updated messages array in persistent storage
            await teamsDB.setItem('messages', JSON.stringify(messages));

            // Verify that messages upgrade was successful
            let testMessages = await teamsDB.getItem('messages');
            if (testMessages != null && testMessages == JSON.stringify(messages)) {
                logger.log(`[dbUpgrader][v6] - Messages upgrade completed successfully.`);
            } else {
                logger.error(`[dbUpgrader][v6] - Error when upgrading messages.`);
                throw new Error("Error when upgrading messages.");
            }
        } catch (error) {
            logger.error(`[dbUpgrader][v6] - Error: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    // Upgrade database
    const upgrade = async () => {
        const upgradeDialog = $q.notify({
            group: false, // required to be updatable
            timeout: 0,   // we want to be in control when it gets dismissed
            spinner: true,
            position: 'center',
            message: t('databaseUpgrade.needed.message')
        });

        const dbVersionBeforeUpgrade = await getDBVersion();
        let dbVersionAfterUpgrade = 0;

        let dBUpgrades = dBVersions.filter(version => version.version > dbVersionBeforeUpgrade);
        let progress = 1;
        let nbrUpgrades = dBUpgrades.length;

        try {
            // Execute the needed upgrades
            dBUpgrades.forEach(async (version) => {
                logger.log(`[dbUpgrader] - Upgrading database to version: ${version.version}`);
                upgradeDialog({ caption: `${progress++} of ${nbrUpgrades}` });
                try {
                    logger.log(`[dbUpgrader][v${version.version}] - Upgrading...`);
                    await version.upgrade();
                    logger.log(`[dbUpgrader][v${version.version}] - Upgrade finished`);

                    await setDBVersion(version.version);
                    dbVersionAfterUpgrade = await getDBVersion();
                    logger.log(`[dbUpgrader][v${version.version}] - DB version set to ${dbVersionAfterUpgrade}`);

                    // All upgrades are done
                    upgradeDialog({
                        icon: 'mdi-check',
                        spinner: false,
                        message: t('databaseUpgrade.completed.message'),
                        caption: t('databaseUpgrade.completed.caption', { version: dbVersionAfterUpgrade }),
                        timeout: 5000,
                        actions: [{ label: t('databaseUpgrade.completed.action'), handler: () => { } }]
                    });
                } catch (error) {
                    logger.error(`[dbUpgrader] - Upgrade error: ${JSON.stringify(error)}`);
                    throw error;
                }
            });

        } catch (error) {
            logger.error(`[dbUpgrader] - Upgrade error: ${JSON.stringify(error)}`);

            // Notify user of error
            $q.notify({
                position: 'top',
                icon: 'mdi-alert',
                color: 'negative',
                message: t('databaseUpgrade.error.message'),
                caption: error.message,
                timeout: 5000
            });

            throw error;
        }
    }

    // Public functions
    return {
        isUpgradeNeed,
        upgrade
    }
}

export default databaseUpgrader;