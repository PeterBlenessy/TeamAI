import localforage from 'localforage';
import { useSettingsStore } from '@/stores/settings-store.js';
import logger from '@/services/logger.js';

export async function upgradeToVersion9() {
    try {
        logger.log("[dbUpgrader][v9] - Starting settings migration to localStorage");
        const settingsStore = useSettingsStore();

        const tempSettingsDB = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: 'TeamAI',
            storeName: 'settings',
            description: 'Application settings'
        });

        try {
            const keys = await tempSettingsDB.keys();
            
            if (keys.length > 0) {
                logger.log("[dbUpgrader][v9] - Found settings in IndexedDB to migrate");
                const settingsEntries = [];

                for (const key of keys) {
                    if (key in settingsStore) {
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

                logger.log("[dbUpgrader][v9] - Updating settings store");
                for (const [key, value] of settingsEntries) {
                    try {
                        if (typeof settingsStore[key] === 'object' && 'value' in settingsStore[key]) {
                            settingsStore[key].value = value;
                        } else {
                            settingsStore[key] = value;
                        }
                        logger.log(`[dbUpgrader][v9] - Updated ${key} in settings store`);
                    } catch (error) {
                        logger.error(`[dbUpgrader][v9] - Error updating ${key}: ${error.message}`);
                    }
                }

                logger.log("[dbUpgrader][v9] - Dropping settings database");
                try {
                    await localforage.dropInstance({
                        name: 'TeamAI',
                        storeName: 'settings'
                    });
                    logger.log("[dbUpgrader][v9] - Settings database dropped");
                } catch (error) {
                    logger.error(`[dbUpgrader][v9] - Error dropping database: ${error.message}`);
                }
            } else {
                logger.log("[dbUpgrader][v9] - No settings found in IndexedDB to migrate");
            }
        } finally {
            await tempSettingsDB.clear();
        }

        logger.log("[dbUpgrader][v9] - Settings migration completed");
    } catch (error) {
        logger.error(`[dbUpgrader][v9] - Error: ${error.message}`);
        throw error;
    }
}
