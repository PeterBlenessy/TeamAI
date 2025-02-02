import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import localforage from 'localforage';
import { settingsDB } from '@/services/localforage.js';
import { useSettingsStore } from '@/stores/settings-store.js';
import logger from '@/services/logger.js';
import { upgradeToVersion6 } from './upgrades/v6';
import { upgradeToVersion7 } from './upgrades/v7';
import { upgradeToVersion8 } from './upgrades/v8';
import { upgradeToVersion9 } from './upgrades/v9';
import { upgradeToVersion10 } from './upgrades/v10';

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
        },
        {
            version: 9,
            description: 'Migrated application settings from IndexedDB to localStorage.',
            caption: t('databaseUpgrade.inProgress.caption', { version: '9' }),
            upgrade: async () => upgradeToVersion9()
        },
        {
            version: 10,
            description: 'Added message tracking for cloud sync.',
            caption: t('databaseUpgrade.inProgress.caption', { version: '10' }),
            upgrade: async () => upgradeToVersion10()
        }
    ];

    // =================================================================================================
    // Update latest database version here when needed
    // -------------------------------------------------------------------------------------------------
    const LATEST_DB_VERSION = 10;

    // =================================================================================================
    const getDBVersion = async () => {
        // Check localStorage first (post v9)
        const settingsStore = useSettingsStore();
        if (settingsStore.dBVersion !== undefined && settingsStore.dBVersion !== null) {
            return settingsStore.dBVersion;
        }
        // If not in localStorage, check IndexedDB (pre v9)
        try {
            const version = await settingsDB.getItem('dBVersion');
            return version ? parseInt(JSON.parse(version)) : 0;
        } catch (error) {
            logger.error(`[dbUpgrader] - Error getting version from IndexedDB: ${error.message}`);
            return 0;
        }
    };
    
    const setDBVersion = async (version) => {
        const settingsStore = useSettingsStore();
        settingsStore.dBVersion = version;
    };

    const isUpgradeNeed = async () => {
        logger.log("[dbUpgrader] - Checking if database upgrade is needed...");
        
        // First check if old settings database exists and needs cleanup
        const hasOldSettings = await checkSettingsDatabase();
        if (hasOldSettings) {
            logger.log("[dbUpgrader] - Old settings database found, upgrade needed");
            return true;
        }

        // Then check version number
        let currentVersion = await getDBVersion();
        let isNeeded = currentVersion < LATEST_DB_VERSION;
        logger.log(`[dbUpgrader] - Current version is ${currentVersion}. Latest version is ${LATEST_DB_VERSION}.`)
        logger.log(`[dbUpgrader] - Version upgrade ${isNeeded ? "" : "not"} needed`);
        return isNeeded;
    }

    // Add new OpenAI models
    const upgradeToVersion7 = async () => {
        try {
            const settingsStore = useSettingsStore();
            
            if (!settingsStore.hasOwnProperty('modelOptions')) return;
            
            const modelOptions = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'];
            settingsStore.modelOptions.value = modelOptions;
            await settingsDB.setItem('modelOptions', JSON.stringify(modelOptions));
        } catch (error) {
            logger.error(`[dbUpgrader][v7] - Error: ${error.message}`);
            throw error;
        }
    }

    // Clean up stuff that should not be persisted as states
    const upgradeToVersion8 = async () => {
        try {
            await settingsDB.removeItem('modelOptions');
        } catch (error) {
            logger.error(`[dbUpgrader][v8] - Error: ${error.message}`);
            throw error;
        }
    }

    // Check if old settings database needs migration
    const checkSettingsDatabase = async () => {
        const tempSettingsDB = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: 'TeamAI',
            storeName: 'settings',
            description: 'Application settings'
        });

        try {
            const keys = await tempSettingsDB.keys();
            await tempSettingsDB.clear(); // Clean up the temporary instance
            return keys.length > 0;
        } catch (error) {
            logger.error(`[dbUpgrader] - Error checking settings database: ${error.message}`);
            return false;
        }
    };

    // Migrate settings from IndexedDB to localStorage and ensure cleanup
    const upgradeToVersion9 = async () => {
        try {
            logger.log("[dbUpgrader][v9] - Starting settings migration to localStorage");
            const settingsStore = useSettingsStore();

            // Since settingsDB might be null (if dBVersion already exists in localStorage),
            // we need to create a temporary instance to check for any remaining data
            const tempSettingsDB = localforage.createInstance({
                driver: localforage.INDEXEDDB,
                name: 'TeamAI',
                storeName: 'settings',
                description: 'Application settings'
            });

            try {
                // Check if there's any data in IndexedDB to migrate
                const keys = await tempSettingsDB.keys();
                
                if (keys.length > 0) {
                    logger.log("[dbUpgrader][v9] - Found settings in IndexedDB to migrate");
                    const settingsEntries = [];

                    // Process each key sequentially
                    for (const key of keys) {
                        if (key in settingsStore) { // Only migrate keys that exist in the store
                            try {
                                const value = await tempSettingsDB.getItem(key);
                                if (value !== null) {
                                    const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
                                    settingsEntries.push([key, parsedValue]);
                                    logger.log(`[dbUpgrader][v9] - Read ${key} from IndexedDB`);
                                }
                            } catch (error) {
                                logger.error(`[dbUpgrader][v9] - Error reading ${key}: ${error.message}`);
                            }
                        }
                    }

                    // Update settings store with migrated values
                    logger.log("[dbUpgrader][v9] - Updating settings store");
                    for (const [key, value] of settingsEntries) {
                        try {
                            if (typeof settingsStore[key] === 'object' && 'value' in settingsStore[key]) {
                                // Handle ref values
                                settingsStore[key].value = value;
                            } else {
                                // Handle direct values
                                settingsStore[key] = value;
                            }
                            logger.log(`[dbUpgrader][v9] - Updated ${key} in settings store`);
                        } catch (error) {
                            logger.error(`[dbUpgrader][v9] - Error updating ${key}: ${error.message}`);
                        }
                    }

                    // Drop settings database store after successful migration
                    logger.log("[dbUpgrader][v9] - Dropping settings database");
                    try {
                        await localforage.dropInstance({
                            name: 'TeamAI',
                            storeName: 'settings'
                        });
                        logger.log("[dbUpgrader][v9] - Settings database dropped");
                    } catch (error) {
                        logger.error(`[dbUpgrader][v9] - Error dropping database: ${error.message}`);
                        // Continue even if drop fails - the data is still migrated to localStorage
                    }
                } else {
                    logger.log("[dbUpgrader][v9] - No settings found in IndexedDB to migrate");
                }
            } finally {
                await tempSettingsDB.clear(); // Clean up any remaining data
            }

            logger.log("[dbUpgrader][v9] - Settings migration completed");
        } catch (error) {
            logger.error(`[dbUpgrader][v9] - Error: ${error.message}`);
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
                                logger.error(`[dbUpgrader][v6] - Store image error: ${error.message}`);
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
            logger.error(`[dbUpgrader][v6] - Error: ${error.message}`);
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
        let nbrUpgrades = dBUpgrades.length;

        try {
            // Ensure version 9 upgrade runs if old settings database exists
            const hasOldSettings = await checkSettingsDatabase();
            if (hasOldSettings) {
                logger.log("[dbUpgrader] - Found old settings database, running v9 upgrade");
                upgradeDialog({ caption: "1 of 1" });
                try {
                    await upgradeToVersion9();
                    await setDBVersion(9);
                    dbVersionAfterUpgrade = 9;
                } catch (error) {
                    logger.error(`[dbUpgrader] - Settings migration error: ${error.message}`);
                    throw error;
                }
            } else {
                // Execute regular version upgrades sequentially
                for (let i = 0; i < dBUpgrades.length; i++) {
                    const version = dBUpgrades[i];
                    logger.log(`[dbUpgrader] - Upgrading database to version: ${version.version}`);
                    upgradeDialog({ caption: `${i + 1} of ${nbrUpgrades}` });
                    
                    try {
                        logger.log(`[dbUpgrader][v${version.version}] - Upgrading...`);
                        await version.upgrade();
                        logger.log(`[dbUpgrader][v${version.version}] - Upgrade finished`);

                        await setDBVersion(version.version);
                        dbVersionAfterUpgrade = version.version;
                        logger.log(`[dbUpgrader][v${version.version}] - DB version set to ${dbVersionAfterUpgrade}`);
                    } catch (error) {
                        logger.error(`[dbUpgrader][v${version.version}] - Upgrade error: ${error.message}`);
                        throw error;
                    }
                }
            }

            // Only show completion notification after all upgrades are done
            upgradeDialog({
                icon: 'mdi-check',
                spinner: false,
                message: t('databaseUpgrade.completed.message'),
                caption: t('databaseUpgrade.completed.caption', { version: dbVersionAfterUpgrade }),
                timeout: 5000,
                actions: [{ label: t('databaseUpgrade.completed.action'), handler: () => { } }]
            });

        } catch (error) {
            logger.error(`[dbUpgrader] - Upgrade error: ${error.message}`);

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
