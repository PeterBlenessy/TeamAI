import localforage from 'localforage';
import { useSettingsStore } from '@/stores/settings-store.js';
import logger from '@/services/logger.js';

// Migrate settings from IndexedDB to localStorage and ensure cleanup
export async function upgradeToVersion9() {
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
