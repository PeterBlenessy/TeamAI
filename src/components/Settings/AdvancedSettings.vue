<template>
    <q-list>
        <!-- Logging Settings Section -->
        <q-item-label header>{{ t('settings.advanced.logging.label') }}</q-item-label>
        <q-item-label caption>{{ t('settings.advanced.logging.caption') }}</q-item-label>

        <!-- Enable Logging Toggle -->
        <q-item>
            <q-item-section avatar>
                <q-icon :name="loggingEnabled ? mdiTextBoxCheck : mdiTextBoxRemove" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.advanced.logging.enabled.label') }}</q-item-label>
                <q-item-label caption>{{ t('settings.advanced.logging.enabled.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle v-model="loggingEnabled" dense />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.advanced.logging.enabled.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <!-- Log Level Selection -->
        <q-item v-if="loggingEnabled">
            <q-item-section avatar>
                <q-icon :name="mdiTuneVertical" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.advanced.logging.level.label') }}</q-item-label>
                <q-item-label caption>{{ t('settings.advanced.logging.level.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-select v-model="logLevel" :options="logLevels" dense options-dense 
                    :option-label="opt => t(`settings.advanced.logging.level.levels.${opt}`)"
                />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.advanced.logging.level.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <!-- View Logs Button -->
        <q-item v-if="loggingEnabled">
            <q-item-section avatar>
                <q-icon :name="mdiTextBox" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.advanced.logging.viewer.label') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-btn :icon="mdiOpenInNew" flat round dense @click="openLogViewer">
                    <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                        {{ t('settings.advanced.logging.viewer.tooltip') }}
                    </q-tooltip>
                </q-btn>
            </q-item-section>
        </q-item>
    </q-list>

    <!-- Log Viewer Dialog -->
    <q-dialog v-model="showLogViewer" maximized>
        <q-card>
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ t('settings.advanced.logging.viewer.title') }}</div>
                <q-space />
                <q-btn :icon="mdiContentCopy" flat round dense @click="copyLogs">
                    <q-tooltip>{{ t('settings.advanced.logging.viewer.copy') }}</q-tooltip>
                </q-btn>
                <q-btn :icon="mdiDelete" flat round dense @click="clearLogs">
                    <q-tooltip>{{ t('settings.advanced.logging.viewer.clear') }}</q-tooltip>
                </q-btn>
                <q-btn :icon="mdiClose" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pa-md">
                <q-scroll-area style="height: calc(100vh - 120px);">
                    <pre v-if="logs" class="text-body2">{{ logs }}</pre>
                    <div v-else class="text-grey text-center q-pa-md">
                        {{ t('settings.advanced.logging.viewer.empty') }}
                    </div>
                </q-scroll-area>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useHelpers } from '@/composables/useHelpers';
import { useSettingsStore } from '@/stores/settings-store.js';
import { mdiTextBoxCheck, mdiTextBoxRemove, mdiTuneVertical, mdiTextBox, 
    mdiOpenInNew, mdiClose, mdiContentCopy, mdiDelete } from '@quasar/extras/mdi-v7';
import { useLogger } from '@/composables/useLogger';

const $q = useQuasar();
const { t } = useI18n();
const settingsStore = useSettingsStore();
const { loggingEnabled, logLevel } = storeToRefs(settingsStore);
const { iconColor } = useHelpers();
const { readLogs, clearLogs: clearLogFile } = useLogger();

const logLevels = ['trace', 'debug', 'info', 'warn', 'error'];
const showLogViewer = ref(false);
const logs = ref('');

const openLogViewer = async () => {
    logs.value = await readLogs();
    showLogViewer.value = true;
};

const copyLogs = () => {
    navigator.clipboard.writeText(logs.value);
    $q.notify({
        message: t('general.success'),
        type: 'positive',
        position: 'top'
    });
};

const clearLogs = async () => {
    const success = await clearLogFile();
    if (success) {
        logs.value = '';
        $q.notify({
            message: t('general.success'),
            type: 'positive',
            position: 'top'
        });
    } else {
        $q.notify({
            message: t('general.failed'),
            type: 'negative',
            position: 'top'
        });
    }
};

onMounted(async () => {
    // Pre-load logs when component mounts
    logs.value = await readLogs();
});
</script>
