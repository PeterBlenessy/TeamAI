import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '@/stores/settings-store';
import { useTeamsStore } from '@/stores/teams-store';
import iCloudService from '@/services/iCloudService';
import logger from '@/services/logger';

export function useCloudSync() {
    const { t } = useI18n();
    const $q = useQuasar();
    const settingsStore = useSettingsStore();
    const teamsStore = useTeamsStore();
    const syncing = ref(false);

    const syncToCloud = async () => {
        if (syncing.value) return;
        syncing.value = true;
        
        logger.log('[CloudSync] - iCloud sync requested');
        
        if (!iCloudService.isAvailable()) {
            $q.notify({
                position: 'bottom-right',
                icon: 'mdi-cloud-off',
                type: 'warning',
                message: t('icloud.sync.unavailable.message'),
                caption: t('icloud.sync.unavailable.caption'),
                timeout: 3000
            });
            syncing.value = false;
            return;
        }

        try {
            let notifyRef = $q.notify({
                position: 'bottom-right',
                timeout: 0,
                spinner: true,
                icon: 'mdi-cloud-sync',
                message: t('icloud.sync.checking.message')
            });

            // Define sync configurations
            const syncConfigs = [
                {
                    type: 'settings',
                    enabled: settingsStore.syncOptions.settings,
                    getLatest: () => iCloudService.getLatestSettings(),
                    sync: (data) => iCloudService.syncSettings(data, settingsStore.syncOptions),
                    cleanup: () => iCloudService.cleanupOldSettings(5),
                    store: settingsStore,
                    getData: () => settingsStore.$state,
                    applyData: (data) => {
                        const newSettings = data.settings;
                        if (!settingsStore.syncOptions.personas) {
                            delete newSettings.personas;
                        }
                        settingsStore.$patch(newSettings);
                    }
                },
                {
                    type: 'personas',
                    enabled: settingsStore.syncOptions.personas,
                    getLatest: () => iCloudService.getLatestPersonas(),
                    sync: (data) => iCloudService.syncPersonas(data),
                    cleanup: () => iCloudService.cleanupOldPersonas(5),
                    store: teamsStore,
                    getData: () => teamsStore.personas,
                    applyData: (data) => teamsStore.personas = data.personas
                },
                {
                    type: 'conversations',
                    enabled: settingsStore.syncOptions.conversations,
                    getLatest: () => iCloudService.getLatestConversations(),
                    sync: () => iCloudService.syncConversations(teamsStore),
                    cleanup: () => iCloudService.cleanupOldConversations(5),
                    store: teamsStore,
                    getData: () => teamsStore.$state,
                    applyData: () => {}
                }
            ];

            // Handle sync for each enabled configuration
            for (const config of syncConfigs) {
                if (!config.enabled) continue;

                try {
                    const latestData = await config.getLatest();
                    
                    if (latestData && (!settingsStore.lastSync || new Date(latestData.timestamp) > new Date(settingsStore.lastSync))) {
                        if (notifyRef) {
                            notifyRef();  // Dismiss current notification
                        }
                        
                        // Ask user to confirm sync
                        await new Promise((resolve) => {
                            $q.dialog({
                                title: t(`icloud.sync.${config.type}.found.title`),
                                message: t(`icloud.sync.${config.type}.found.message`),
                                cancel: true,
                                persistent: true,
                                ok: {
                                    label: t(`icloud.sync.${config.type}.actions.sync`),
                                    color: 'primary'
                                },
                                cancel: {
                                    label: t(`icloud.sync.${config.type}.actions.skip`),
                                    color: 'primary',
                                    flat: true
                                }
                            }).onOk(async () => {
                                config.applyData(latestData);
                                $q.notify({
                                    position: 'bottom-right',
                                    type: 'positive',
                                    icon: 'mdi-cloud-check',
                                    message: t(`icloud.sync.${config.type}.loaded.message`),
                                    timeout: 2000
                                });
                                resolve();
                            }).onCancel(() => resolve());
                        });
                    }

                    // Show upload notification
                    if (notifyRef) {
                        notifyRef();  // Dismiss previous notification
                    }
                    notifyRef = $q.notify({
                        position: 'bottom-right',
                        timeout: 0,
                        spinner: true,
                        icon: 'mdi-cloud-upload',
                        message: t('icloud.sync.inProgress.message')
                    });

                    // Sync current data
                    const currentData = config.getData();
                    if (currentData && (Array.isArray(currentData) ? currentData.length > 0 : true)) {
                        await config.sync(currentData);
                        await config.cleanup();
                        
                        if (notifyRef) {
                            notifyRef();  // Dismiss upload notification
                        }
                        
                        $q.notify({
                            position: 'bottom-right',
                            type: 'positive',
                            icon: 'mdi-cloud-check',
                            message: t(`icloud.sync.${config.type}.synced.message`),
                            timeout: 2000
                        });
                    }
                } catch (error) {
                    if (notifyRef) {
                        notifyRef();  // Dismiss any pending notification
                    }
                    
                    logger.error(`[CloudSync] - Error syncing ${config.type}: ${error}`);
                    $q.notify({
                        position: 'bottom-right',
                        type: 'negative',
                        icon: 'mdi-cloud-alert',
                        message: t(`icloud.sync.${config.type}.error.message`),
                        timeout: 2000
                    });
                }
            }

            // Update last sync timestamp
            settingsStore.lastSync = new Date().toISOString();

            // Show final success notification
            notifyRef();
            $q.notify({
                position: 'bottom-right',
                type: 'positive',
                icon: 'mdi-cloud-check',
                message: t('icloud.sync.success.message'),
                timeout: 2000
            });

        } catch (error) {
            logger.error(`[CloudSync] - iCloud sync error: ${error}`);
            $q.notify({
                position: 'bottom-right',
                type: 'negative',
                icon: 'mdi-cloud-alert',
                message: t('icloud.sync.error.message'),
                caption: t('icloud.sync.error.caption'),
                timeout: 3000
            });
        } finally {
            syncing.value = false;
        }
    };

    return {
        syncing,
        syncToCloud
    };
}
