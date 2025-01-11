import { ref, onMounted, onUnmounted } from 'vue';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import logger from '@/services/logger';

export function useAutoUpdater(intervalInMinutes = 60) {
    const isUpdateAvailable = ref(false);
    const updateInfo = ref(null);
    let updateInterval;

    async function checkForUpdates() {
        try {
            const update = await check();
            isUpdateAvailable.value = update?.available || false;
            updateInfo.value = update;
            return update;
        } catch (error) {
            logger.error(`[AutoUpdater] - ${error}`);
            throw error;
        }
    }

    async function downloadAndInstall(update) {
        try {
            await update.downloadAndInstall();
            return true;
        } catch (error) {
            logger.error(`[AutoUpdater] - Download/Install error: ${error}`);
            throw error;
        }
    }

    async function restartApp() {
        try {
            await relaunch();
        } catch (error) {
            logger.error(`[AutoUpdater] - Relaunch error: ${error}`);
            throw error;
        }
    }

    // Start periodic checks
    function startAutoCheck() {
        checkForUpdates(); // Initial check
        updateInterval = setInterval(checkForUpdates, intervalInMinutes * 60 * 1000);
    }

    function stopAutoCheck() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    }

    onMounted(startAutoCheck);
    onUnmounted(stopAutoCheck);

    return {
        isUpdateAvailable,
        updateInfo,
        checkForUpdates,
        downloadAndInstall,
        restartApp
    };
}
