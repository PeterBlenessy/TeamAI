import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import localforage from 'localforage';
import { settingsDB, teamsDB, imageDB } from '@/services/localforage.js';
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



    // Upgrade database
    const upgrade = async () => {
        const upgradeDialog = $q.notify({
            group: false,
            timeout: 0,
            spinner: true,
            position: 'center',
            message: t('databaseUpgrade.needed.message')
        });

        const dbVersionBeforeUpgrade = await getDBVersion();
        let dbVersionAfterUpgrade = 0;

        let dBUpgrades = dBVersions.filter(version => version.version > dbVersionBeforeUpgrade);
        let nbrUpgrades = dBUpgrades.length;

        // Track upgrade attempts for safe recovery
        const attemptedUpgrades = new Set();

        try {
            // Set a timeout for the entire upgrade process
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database upgrade timed out')), 30000)
            );

            const upgradePromise = (async () => {
                // Ensure version 9 upgrade runs if old settings database exists
                const hasOldSettings = await checkSettingsDatabase();
                if (hasOldSettings) {
                    logger.log("[dbUpgrader] - Found old settings database, running v9 upgrade");
                    upgradeDialog({ caption: "1 of 1" });
                    try {
                        await upgradeToVersion9();
                        await setDBVersion(9);
                        dbVersionAfterUpgrade = 9;
                        attemptedUpgrades.add(9);
                    } catch (error) {
                        logger.error(`[dbUpgrader] - Settings migration error: ${error.message}`);
                        // Continue with other upgrades even if settings migration fails
                        logger.info("[dbUpgrader] - Continuing with remaining upgrades");
                    }
                }

                // Execute regular version upgrades strictly sequentially
                for (const version of dBUpgrades) {
                    const index = dBUpgrades.indexOf(version) + 1;
                    logger.log(`[dbUpgrader] - Upgrading database to version: ${version.version}`);
                    
                    // Update dialog before each attempt
                    upgradeDialog({
                        message: t('databaseUpgrade.needed.message'),
                        caption: `${index} of ${nbrUpgrades}`,
                        spinner: true
                    });

                    // Skip if this version was already attempted
                    if (attemptedUpgrades.has(version.version)) {
                        logger.info(`[dbUpgrader] - Skipping already attempted version ${version.version}`);
                        continue;
                    }

                    try {
                        // Initialize IndexedDB if needed for early versions
                        if (version.version <= 8) {
                            await localforage.setDriver(localforage.INDEXEDDB);
                        }

                        logger.log(`[dbUpgrader][v${version.version}] - Upgrading...`);
                        await version.upgrade();
                        logger.log(`[dbUpgrader][v${version.version}] - Upgrade finished`);

                        await setDBVersion(version.version);
                        dbVersionAfterUpgrade = version.version;
                        attemptedUpgrades.add(version.version);
                        logger.log(`[dbUpgrader][v${version.version}] - DB version set to ${dbVersionAfterUpgrade}`);

                        // Update dialog after success
                        upgradeDialog({
                            message: t('databaseUpgrade.inProgress.message'),
                            caption: `${index} of ${nbrUpgrades} - v${version.version} completed`,
                            spinner: true
                        });
                    } catch (error) {
                        logger.error(`[dbUpgrader][v${version.version}] - Upgrade error: ${error.message}`);
                        
                        // Show error in dialog
                        upgradeDialog({
                            icon: 'mdi-alert',
                            color: 'negative',
                            message: t('databaseUpgrade.error.message'),
                            caption: `Error in v${version.version}: ${error.message}`,
                            spinner: true
                        });

                        // If a critical version fails (v6-v8), we need to reset to defaults
                        if (version.version <= 8) {
                            logger.error(`[dbUpgrader] - Critical version ${version.version} failed, resetting to defaults`);
                            throw new Error(`Critical database upgrade failed: ${error.message}`);
                        }
                        
                        // For non-critical versions (v9+), continue with next upgrade
                        logger.warn(`[dbUpgrader] - Non-critical version ${version.version} failed, continuing`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Show error briefly
                        continue;
                    }

                    // Brief pause between upgrades
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            })();

            // Race between timeout and upgrade process
            await Promise.race([upgradePromise, timeoutPromise]);

            // Show completion notification
            upgradeDialog({
                icon: dbVersionAfterUpgrade > 0 ? 'mdi-check' : 'mdi-alert',
                spinner: false,
                message: dbVersionAfterUpgrade > 0 
                    ? t('databaseUpgrade.completed.message')
                    : t('databaseUpgrade.error.resetToDefaults'),
                caption: dbVersionAfterUpgrade > 0
                    ? t('databaseUpgrade.completed.caption', { version: dbVersionAfterUpgrade })
                    : t('databaseUpgrade.error.caption'),
                timeout: 5000,
                actions: [{ label: t('databaseUpgrade.completed.action'), handler: () => { } }]
            });

        } catch (error) {
            logger.error(`[dbUpgrader] - Upgrade error: ${error.message}`);

            const isTimeout = error.message === 'Database upgrade timed out';
            
            // Reset to defaults if upgrade timed out or critical failure occurred
            if (isTimeout || error.message.includes('Critical database upgrade failed')) {
                logger.warn('[dbUpgrader] - Resetting to default values');
                await resetToDefaults();
            }

            // Notify user
            $q.notify({
                position: 'top',
                icon: 'mdi-alert',
                color: 'negative',
                message: isTimeout 
                    ? t('databaseUpgrade.error.timeout')
                    : t('databaseUpgrade.error.message'),
                caption: error.message,
                timeout: 7000
            });

            // Return instead of throwing to allow app to continue with defaults
            return false;
        }

        return true;
    }

    // Reset database to default values
    const resetToDefaults = async () => {
        try {
            const settingsStore = useSettingsStore();
            logger.info('[dbUpgrader] - Resetting database to defaults');
            
            // Reset settings to defaults
            settingsStore.$reset();
            
            // Clear teams database
            try {
                await teamsDB.clear();
                logger.info('[dbUpgrader] - Teams database cleared');
            } catch (error) {
                logger.error(`[dbUpgrader] - Error clearing teams database: ${error.message}`);
            }
            
            // Keep any valid images in imageDB, only clear broken ones
            try {
                const imageKeys = await imageDB.keys();
                for (const key of imageKeys) {
                    try {
                        const image = await imageDB.getItem(key);
                        if (!(image instanceof Blob) || image.size === 0) {
                            await imageDB.removeItem(key);
                            logger.info(`[dbUpgrader] - Removed invalid image: ${key}`);
                        }
                    } catch (error) {
                        await imageDB.removeItem(key);
                        logger.error(`[dbUpgrader] - Error checking image ${key}: ${error.message}`);
                    }
                }
            } catch (error) {
                logger.error(`[dbUpgrader] - Error cleaning up images: ${error.message}`);
            }
            
            // Set to latest version to avoid upgrade loops
            await setDBVersion(LATEST_DB_VERSION);
            
            logger.info('[dbUpgrader] - Reset to defaults completed');
        } catch (error) {
            logger.error(`[dbUpgrader] - Error resetting to defaults: ${error.message}`);
            // Even if reset fails, ensure we don't get stuck in upgrade loop
            try {
                await setDBVersion(LATEST_DB_VERSION);
            } catch (err) {
                logger.error(`[dbUpgrader] - Failed to set version after reset failure: ${err.message}`);
            }
        }
    }

    // Public functions
    return {
        isUpgradeNeed,
        upgrade
    }
}

export default databaseUpgrader;
