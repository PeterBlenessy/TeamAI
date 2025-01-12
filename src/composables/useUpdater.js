import { ref } from 'vue';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import logger from '@/services/logger';

export function useUpdater() {
    const isUpdateAvailable = ref(false);
    const downloaded = ref(0);
    const contentLength = ref(0);

    async function checkForUpdates() {
        try {
            const update = await check();
            isUpdateAvailable.value = update?.available || false;
            return update;
        } catch (error) {
            logger.error(`[Updater] - ${error}`);
            throw error;
        }
    }

    async function downloadAndInstall() {
        try {
            const update = await check();
            if (!update?.available) {
                logger.info('[Updater] - No updates available');
                return false;
            }

            downloaded.value = 0;
            contentLength.value = 0;

            await update.downloadAndInstall((event) => {
                switch (event.event) {
                    case 'Started':
                        contentLength.value = event.data.contentLength;
                        logger.info(`[Updater] - Started downloading ${event.data.contentLength} bytes`);
                        break;
                    case 'Progress':
                        downloaded.value += event.data.chunkLength;
                        logger.info(`[Updater] - Downloaded ${downloaded.value} from ${contentLength.value}`);
                        break;
                    case 'Finished':
                        logger.info('[Updater] - Download finished');
                        break;
                }
            });
            return true;
        } catch (error) {
            logger.error(`[Updater] - Download/Install error: ${error}`);
            throw error;
        }
    }

    async function relaunchApp() {
        try {
            await relaunch();
        } catch (error) {
            logger.error(`[Updater] - Relaunch error: ${error}`);
            throw error;
        }
    }

    return {
        isUpdateAvailable,
        downloaded,
        contentLength,
        checkForUpdates,
        downloadAndInstall,
        relaunchApp
    };
}
