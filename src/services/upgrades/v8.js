import { settingsDB } from '@/services/localforage.js';
import logger from '@/services/logger.js';

export async function upgradeToVersion8() {
    try {
        await settingsDB.removeItem('modelOptions');
    } catch (error) {
        logger.error(`[dbUpgrader][v8] - Error: ${error.message}`);
        throw error;
    }
}
