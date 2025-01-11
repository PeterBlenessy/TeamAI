<template>
  <!-- Component has no visual elements -->
</template>

<script setup>
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { mdiAlert, mdiCheck, mdiInformation } from '@quasar/extras/mdi-v7';
import logger from '@/services/logger';

const { t } = useI18n();
const $q = useQuasar();

// Add emits declaration
const emit = defineEmits(['update-available', 'update-not-available', 'error']);

async function checkForUpdates() {
    try {
        const update = await check();

        if (update?.available) {
            logger.log(`[Updater] - Update to ${update.version} available! Date: ${update.date}`);
            logger.log(`[Updater] - Release notes: ${update.body}`);

            // Format release notes - split by newlines and add bullet points
            const releaseNotes = update.body
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => `- ${line}`)
                .join('<br>');

            // Format the release date
            const releaseDate = update.date.split(" ")[0];

            // Ask user to download and install update
            $q.dialog({
                title: t('updater.updateAvailable.title'),
                message: `<div class="text-body1 q-mb-md">${t('updater.updateAvailable.message')}</div>
                         <div class="text-caption">Version: ${update.version}</div>
                         <div class="text-caption">Release date: ${releaseDate}</div>
                         <div class="text-overline mt-2">${t('updater.releaseNotes.message')}</div>
                         <div class="text-caption">${releaseNotes}</div>`,
                html: true,
                ok: {
                    label: t('updater.updateAvailable.actions.install'),
                    color: 'primary'
                },
                cancel: {
                    label: t('updater.updateAvailable.actions.later'),
                    flat: true
                },
                persistent: true
            }).onOk(async () => {
                try {
                    // Show download progress
                    const downloadNotif = $q.notify({
                        message: t('updater.downloading.message'),
                        caption: t('updater.downloading.caption'),
                        timeout: 0,
                        spinner: true
                    });

                    await update.downloadAndInstall();
                    downloadNotif();

                    // Ask for restart
                    $q.dialog({
                        title: t('updater.relaunch.title'),
                        message: t('updater.relaunch.message'),
                        ok: {
                            label: t('updater.relaunch.actions.restart'),
                            color: 'primary'
                        },
                        cancel: {
                            label: t('updater.relaunch.actions.later'),
                            flat: true
                        },
                        persistent: true
                    }).onOk(async () => {
                        await relaunch();
                    }).onCancel(() => {
                        $q.notify({
                            type: 'info',
                            message: t('updater.relaunchLater.message'),
                            caption: t('updater.relaunchLater.caption'),
                            timeout: 3000
                        });
                    });
                } catch (error) {
                    logger.error(`[Updater] - Download/Install error: ${error}`);
                    $q.notify({
                        type: 'negative',
                        message: t('updater.error.message'),
                        caption: error.toString(),
                        icon: mdiAlert
                    });
                }
            });
            emit('update-available', update);
            return update;
        } else {
            logger.log("[Updater] - No update available");
            $q.notify({
                type: 'info',
                message: t('updater.upToDate.message'),
            });
            emit('update-not-available');
            return null;
        }
    } catch (error) {
        logger.error(`[Updater] - Check error: ${error}`);
        $q.notify({
            type: 'negative',
            message: t('updater.error.message'),
            caption: error.toString(),
            icon: mdiAlert
        });
        emit('error', error);
        throw error;
    }
}

defineExpose({
    checkForUpdates
});
</script>
