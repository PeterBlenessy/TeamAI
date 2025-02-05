import { settingsDB } from '@/services/localforage.js';
import localforage from 'localforage';
import logger from '@/services/logger.js';

export async function upgradeToVersion8() {
    try {
        logger.log("[dbUpgrader][v8] - Starting cleanup of persisted states");
        
        // Ensure settingsDB is using IndexedDB
        const db = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: 'TeamAI',
            storeName: 'settings'
        });

        try {
            await db.removeItem('modelOptions');
            logger.log("[dbUpgrader][v8] - Removed modelOptions from settings");
        } catch (error) {
            logger.error(`[dbUpgrader][v8] - Error removing modelOptions: ${error.message}`);
            // Continue even if item doesn't exist
        }

        logger.log("[dbUpgrader][v8] - Cleanup completed successfully");
    } catch (error) {
        logger.error(`[dbUpgrader][v8] - Error: ${error.message}`);
        throw error;
    }
}
