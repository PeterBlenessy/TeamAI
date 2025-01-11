import { ref, onMounted, onUnmounted } from 'vue';
import logger from '@/services/logger';

export function useAutoUpdater(checkForUpdatesFn, intervalInMinutes = 60) {
    const isUpdateAvailable = ref(false);
    const updateInfo = ref(null);
    let updateInterval;

    async function checkForUpdates() {
        try {
            const result = await checkForUpdatesFn();
            isUpdateAvailable.value = result?.available || false;
            updateInfo.value = result;
        } catch (error) {
            logger.error(`[AutoUpdater] - ${error}`);
        }
    }

    // Start periodic checks
    function startAutoCheck() {
        checkForUpdates(); // Initial check
        updateInterval = setInterval(checkForUpdates, intervalInMinutes * 60 * 1000);
    }

    // Clean up on component unmount
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
        checkForUpdates
    };
}
