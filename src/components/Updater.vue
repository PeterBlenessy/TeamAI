<template>
    <!-- Update Available Dialog -->
    <q-dialog v-model="showUpdateAvailableDialog">
        <q-card>
            <q-card-section class="row" >
                <div class="text-h6 text-weight-bold">{{ t('updater.updateAvailable.title') }}</div>
                <q-space />
                <q-btn :icon="mdiClose" flat dense v-close-popup />
            </q-card-section>
            <q-separator />

            <q-card-section>
                <div class="text-caption">Version: {{ updateVersion }}</div>
                <div class="text-caption">Release date: {{ releaseDate }}</div>
                <div class="text-overline mt-2">{{ t('updater.releaseNotes.message') }}</div>
                <div class="text-caption" v-html="`<ul class='pl-4'>${releaseNotes}</ul>`"></div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat :label="t('updater.updateAvailable.actions.dismiss')" color="grey-13" v-close-popup />
                <q-btn flat :label="t('updater.updateAvailable.actions.install')" color="primary" @click="handleInstall" />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <!-- Download Progress Dialog -->
    <q-dialog v-model="showDownloadDialog" persistent>
        <q-card style="min-width: 300px">
            <q-card-section class="row items-center">
                <div>{{ t('updater.downloading.message') }}</div>
                <q-space />
                <q-circular-progress
                    show-value
                    font-size="16px"
                    :value="Math.round(downloadProgress * 100)"
                    size="90px"
                    :thickness="0.22"
                    :color="isDownloadComplete ? 'positive' : 'primary'"
                    class="q-ma-md"
                >
                    {{ Math.round(downloadProgress * 100) }}%
                </q-circular-progress>
            </q-card-section>

            <q-card-actions align="right" v-if="isDownloadComplete">
                <q-btn flat :label="t('updater.relaunch.actions.dismiss')" @click="handleRelaunchDismiss" v-close-popup/>
                <q-btn flat :label="t('updater.relaunch.actions.relaunch')" @click="handleRelaunch" color="primary" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { mdiAlert, mdiClose } from '@quasar/extras/mdi-v7';
import { useUpdater } from '@/composables/useUpdater';
import logger from '@/services/logger';

const { t } = useI18n();
const $q = useQuasar();

const showUpdateAvailableDialog = ref(false);
const showDownloadDialog = ref(false);
const isDownloadComplete = ref(false);
const updateVersion = ref('');
const releaseDate = ref('');
const releaseNotes = ref('');

const { checkForUpdates, downloadAndInstall, relaunchApp, downloaded, contentLength } = useUpdater();

const downloadProgress = computed(() => {
    if (contentLength.value === 0) return 0;
    return downloaded.value / contentLength.value;
});

async function handleCheckForUpdates() {
    try {
        const update = await checkForUpdates();

        if (update?.available) {
            logger.log(`[Updater] - Update to ${update.version} available! Date: ${update.date}`);
            
            // Format release notes and date
            updateVersion.value = update.version;
            releaseDate.value = update.date.split(" ")[0];
            releaseNotes.value = update.body
                .split('- ')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => `<li>${line}</li>`)
                .join('<br>');

            showUpdateAvailableDialog.value = true;
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

async function handleInstall() {
    try {
        showUpdateAvailableDialog.value = false;
        showDownloadDialog.value = true;
        isDownloadComplete.value = false;
        
        await downloadAndInstall();
        isDownloadComplete.value = true;
    } catch (error) {
        showDownloadDialog.value = false;
        logger.error(`[Updater] - Error during update process: ${error}`);
        $q.notify({
            type: 'negative',
            message: t('updater.error.message'),
            caption: error.toString(),
            icon: mdiAlert
        });
    }
}

async function handleRelaunch() {
    await relaunchApp();
}

function handleRelaunchDismiss() {
    $q.notify({
        type: 'info',
        message: t('updater.relaunchDismiss.message'),
        caption: t('updater.relaunchDismiss.caption'),
        timeout: 3000
    });
}

defineExpose({
    checkForUpdates: handleCheckForUpdates
});
</script>
