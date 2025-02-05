import localforage from 'localforage';
import { useSettingsStore } from '@/stores/settings-store.js';
import logger from '@/services/logger.js';

export async function upgradeToVersion7() {
    try {
        logger.log("[dbUpgrader][v7] - Starting OpenAI models update");
        
        // Ensure settingsDB is using IndexedDB
        const db = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: 'TeamAI',
            storeName: 'settings'
        });

        const settingsStore = useSettingsStore();
        
        if (!settingsStore.hasOwnProperty('modelOptions')) {
            logger.log("[dbUpgrader][v7] - modelOptions not found in settings store, skipping");
            return;
        }
        
        const modelOptions = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview'];

        try {
            settingsStore.modelOptions.value = modelOptions;
            logger.log("[dbUpgrader][v7] - Updated modelOptions in settings store");
        } catch (error) {
            logger.error(`[dbUpgrader][v7] - Error updating store: ${error.message}`);
            // Continue to try database update even if store update fails
        }

        try {
            await db.setItem('modelOptions', JSON.stringify(modelOptions));
            logger.log("[dbUpgrader][v7] - Saved modelOptions to database");
        } catch (error) {
            logger.error(`[dbUpgrader][v7] - Error saving to database: ${error.message}`);
            throw error; // Database save is critical, so throw error
        }

        logger.log("[dbUpgrader][v7] - OpenAI models update completed successfully");
    } catch (error) {
        logger.error(`[dbUpgrader][v7] - Error: ${error.message}`);
        throw error;
    }
}
