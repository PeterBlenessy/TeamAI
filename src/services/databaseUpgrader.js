import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';
import { imageDB, settingsDB } from '../services/localforage.js';

const databaseUpgrader = () => {

    const { t } = useI18n();
    const $q = useQuasar();

    const teamsStore = useTeamsStore();
    const { messages } = storeToRefs(teamsStore);

    const dBVersions = [
        {
            version: 1,
            description: 'First database version',
            caption: t('databaseUpgrade.inProgress.caption', { version: '1' }),
            upgrade: () => {}
        },
        {
            version: 4,
            description: 'Optimized database structure by moving images from messages to separate table.',
            caption: t('databaseUpgrade.inProgress.caption', { version: '4' }),
            upgrade: () => upgradeToVersion4()
        }

    ];
    
    // =================================================================================================
    // Update latest database version here when needed
    // -------------------------------------------------------------------------------------------------
    const LATEST_DB_VERSION = 4;
    // =================================================================================================

    const getDBVersion = async () => parseInt(JSON.parse(await settingsDB.getItem('dBVersion')));
    const setDBVersion = async (version) => await settingsDB.setItem('dBVersion', JSON.stringify(version));

    const isUpgradeNeed = async () => {
        console.log("Checking if database upgrade is needed.");
        const currentVersion = await getDBVersion();
        console.log("Current database version: ", currentVersion);
        console.log("Latest database version: ", LATEST_DB_VERSION);
        console.log("Upgrade needed: ", currentVersion < LATEST_DB_VERSION ? true : false);
        return currentVersion < LATEST_DB_VERSION ? true : false;
    }

    // Upgrade to mitigate performance issues due to images being stored in message objects.
    // This upgrade moves images to a separate table, imageDB.
    const upgradeToVersion4 = () => {
        if (messages.value.length == 0) {
            console.log("No messages to upgrade.");
            return;
        }
        messages.value = messages.value.map(message => {
            if (message.object == 'image' &&
                message.hasOwnProperty('choices') &&
                message.choices.length > 0) {

                console.log("Processing message: ", message.timestamp);

                message.choices.forEach(async (item, index) => {
                    if (item.content.startsWith('image')) {
                        // Check that image exists in imageDB
                        const image = await imageDB.getItem(item.content)
                        if (image != null) {
                            console.log("Image exists in imageDB.", item.content)
                        } else {
                            console.log("Image does not exist in imageDB. Removing reference from message.", item.content)
                            // Remove image reference from message
                            message.choices.splice(index, 1);
                        }
                    } else if (item.content.startsWith('data:image')) {
                        // Found base64 image, move to imageDB
                        try {
                            let imageName = 'image' + '-' + message.timestamp + '-' + item.index;
                            console.log('Found base64 image. Moving to imageDB with imageName: ', imageName);

                            // Create blob from base64 image and store it in imageDB
                            let response = await fetch(item.content);
                            let blob = await response.blob();
                            await imageDB.setItem(imageName, blob);

                            const testImage = await imageDB.getItem(imageName);
                            if (testImage != null) {
                                // Update message with image name
                                const newItem = {index: item.index, content: imageName};
                                message.choices.splice(index, 1, newItem);
                            } else {
                                throw new Error("Error when moving image: " + imageName);
                            }
                            // todo: Generate image thumbnail

                        } catch (error) {
                            console.error(error);
                            throw error;
                        }
                    }
                });

            } else {
                // No image in message, do nothing
                console.log("No image in message, do nothing.", message.timestamp);
            }
            return message;
        });
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

        let dBUpgrades = dBVersions.filter(version => version.version > dbVersionBeforeUpgrade);
        let progress = 0;
        let nbrUpgrades = dBUpgrades.length;


        console.log(dBUpgrades);

        try {
            // Execute the needed upgrades
            dBUpgrades.forEach(async (version) => {
                console.log('Upgrading database to version: ', version.version);
                upgradeDialog({ caption: `${progress++} of ${nbrUpgrades}` });
                try {
                    version.upgrade();
                    await setDBVersion(version.version);
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            });
 
            // All upgrades are done
            const dbVersionAfterUpgrade = await getDBVersion();
            upgradeDialog({
                icon: 'mdi-check',
                spinner: false,
                message: t('databaseUpgrade.completed.message'),
                caption: t('databaseUpgrade.completed.caption', { version: dbVersionAfterUpgrade }),
                timeout: 5000,
                actions: [{ label: t('databaseUpgrade.completed.action'), handler: () => { } }]
            });
        } catch (error) {
            console.error(error);

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