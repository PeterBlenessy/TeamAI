<template>
  <!-- Component has no visual elements -->
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { mdiAlert } from '@quasar/extras/mdi-v7';
import { useAutoUpdater } from '@/composables/useAutoUpdater';
import logger from '@/services/logger';

const { t } = useI18n();
const $q = useQuasar();

const { checkForUpdates, downloadAndInstall, restartApp } = useAutoUpdater();

async function handleCheckForUpdates() {
    try {
        const update = await checkForUpdates();

        if (update?.available) {
            logger.log(`[Updater] - Update to ${update.version} available! Date: ${update.date}`);
            
            // Format release notes and date
            const releaseNotes = update.body
                .split('- ')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => `<li>${line}</li>`)
                .join('<br>');
            const releaseDate = update.date.split(" ")[0];

            // Ask user to download and install update
            $q.dialog({
                title: t('updater.updateAvailable.message'),
                message: `<div class="text-caption">Version: ${update.version}</div>
                         <div class="text-caption">Release date: ${releaseDate}</div>
                         <div class="text-overline mt-2">${t('updater.releaseNotes.message')}</div>
                         <div class="text-caption"><ul class="pl-4">${releaseNotes}</ul></div>`,
                html: true,
                ok: {
                    label: t('updater.updateAvailable.actions.install'),
                    textColor: 'primary',
                    flat: true
                },
                cancel: {
                    label: t('updater.updateAvailable.actions.later'),
                    flat: true,
                    textColor: 'grey-13',
                },
                persistent: false
            }).onOk(async () => {
                try {
                    // Show download progress
                    const downloadNotif = $q.notify({
                        message: t('updater.downloading.message'),
                        caption: t('updater.downloading.caption'),
                        timeout: 0,
                        spinner: true
                    });

                    await downloadAndInstall(update);
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
                        await restartApp();
                    }).onCancel(() => {
                        $q.notify({
                            type: 'info',
                            message: t('updater.relaunchLater.message'),
                            caption: t('updater.relaunchLater.caption'),
                            timeout: 3000
                        });
                    });
                } catch (error) {
                    logger.error(`[Updater] - Error during update process: ${error}`);
                    $q.notify({
                        type: 'negative',
                        message: t('updater.error.message'),
                        caption: error.toString(),
                        icon: mdiAlert
                    });
                }
            });
        } else {
            $q.notify({
                type: 'info',
                message: t('updater.upToDate.message'),
            });
        }
    } catch (error) {
        $q.notify({
            type: 'negative',
            message: t('updater.error.message'),
            caption: error.toString(),
            icon: mdiAlert
        });
    }
}

defineExpose({
    checkForUpdates: handleCheckForUpdates
});
</script>
