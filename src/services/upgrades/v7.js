import { settingsDB } from '@/services/localforage.js';
import { useSettingsStore } from '@/stores/settings-store.js';
import logger from '@/services/logger.js';

export async function upgradeToVersion7() {
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
