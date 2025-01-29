import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSettingsStore } from '@/stores/settings-store'
import { useTeamsStore } from '@/stores/teams-store'
import iCloudService from '@/services/iCloudService'
import logger from '@/services/logger'
import { syncStateManager, SyncState, SyncType } from '@/services/syncStateManager'
import { imageDB } from '@/services/localforage'

export function useCloudSync() {
    const { t } = useI18n()
    const $q = useQuasar()
    const settingsStore = useSettingsStore()
    const teamsStore = useTeamsStore()
    
    // Reactive state
    const syncManager = syncStateManager.init()
    const syncing = computed(() => syncManager.syncState === SyncState.IN_PROGRESS)
    const hasUnsynced = computed(() => syncManager.hasLocalChanges())
    const syncProgress = ref(0)
    const syncStatus = ref('')

    // Notify user about sync status
    const notifySync = (type, message, options = {}) => {
        $q.notify({
            position: 'bottom-right',
            ...options,
            message: t(message)
        })
    }

    // Handle sync conflicts
    const handleConflict = async (conflicts) => {
        return new Promise((resolve) => {
            $q.dialog({
                title: t('icloud.sync.conflict.title'),
                message: t('icloud.sync.conflict.message'),
                component: 'sync-conflict-dialog',
                componentProps: {
                    conflicts
                }
            }).onOk(resolve).onCancel(() => resolve([]))
        })
    }

    // Track changes in stores
    const trackStoreChanges = async () => {
        // Get last sync timestamps for comparison
        const lastSync = settingsStore.lastSync ? new Date(settingsStore.lastSync) : null

        // Personas changes
        if (settingsStore.syncOptions.personas) {
            const lastPersonasSync = lastSync?.getTime() || 0
            const changedPersonas = teamsStore.personas.filter(p => p.lastModified > lastPersonasSync)
            if (changedPersonas.length > 0) {
                changedPersonas.forEach((persona, index) => {
                    syncManager.trackChange(
                        SyncType.PERSONAS,
                        `persona_${index}`,
                        persona
                    )
                })
            }
        }

        // Conversations changes
        if (settingsStore.syncOptions.conversations) {
            const lastConversationsSync = lastSync?.getTime() || 0
            const changedConversations = teamsStore.history.filter(conv => conv.timestamp > lastConversationsSync)
            if (changedConversations.length > 0) {
                changedConversations.forEach((conv, index) => {
                    syncManager.trackChange(
                        SyncType.CONVERSATIONS,
                        `conversation_${index}`,
                        conv
                    )
                })
            }
        }

        // Images changes
        if (settingsStore.syncOptions.images) {
            try {
                const lastImageSync = lastSync?.getTime() || 0
                let hasImages = false
                await imageDB.iterate((value, key) => {
                    if (!value.lastModified || value.lastModified > lastImageSync) {
                        hasImages = true
                        syncManager.trackChange(
                            SyncType.IMAGES,
                            key,
                            value
                        )
                    }
                })
                if (!hasImages) {
                    logger.info(`[CloudSync] - No new images to sync`)
                }
            } catch (error) {
                logger.error(`[CloudSync] - Error tracking image changes: ${error}`)
            }
        }
    }

    // Define sync configurations
    const syncConfigs = [
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
        },
        {
            type: 'images',
            enabled: settingsStore.syncOptions.images,
            getLatest: async () => null, // No need to get latest - will be handled by importCloudImages
            sync: async () => {
                await imageDB.iterate(async (value, key) => {
                    await iCloudService.syncImage(key, value);
                });
                await iCloudService.importCloudImages();
            },
            cleanup: () => iCloudService.cleanupOrphanedImages(),
            store: null,
            getData: () => null,
            applyData: () => {} // No need - handled by importCloudImages
        }
    ]

    // Check cloud sync availability and user settings
    const checkCloudSync = () => {
        if (!iCloudService.isAvailable()) {
            notifySync('warning', 'icloud.sync.unavailable.message', {
                icon: 'mdi-cloud-off',
                caption: t('icloud.sync.unavailable.caption'),
                timeout: 3000
            });
            return false;
        }

        if (!settingsStore.cloudSync) {
            $q.dialog({
                title: t('settings.cloud.enableDialog.title'),
                message: t('settings.cloud.enableDialog.message'),
                cancel: true,
                color: 'primary',
                persistent: true,
                ok: {
                    label: t('settings.cloud.enableDialog.ok'),
                    color: 'primary'
                },
                cancel: {
                    label: t('settings.cloud.enableDialog.cancel'),
                    color: 'primary',
                    flat: true
                }
            }).onOk(() => {
                $q.dialog({
                    component: SettingsDialog,
                    componentProps: {
                        initialTab: 'cloudSync'
                    }
                });
            });
            return false;
        }

        return true;
    };

    // Sync to cloud with improved error handling and progress tracking
    const syncToCloud = async () => {
        if (syncing.value || !checkCloudSync()) {
            return;
        }

        try {
            // Start sync process
            syncProgress.value = 0;
            syncStatus.value = t('icloud.sync.checking.message');
            let notifyRef = $q.notify({
                position: 'bottom-right',
                timeout: 0,
                spinner: true,
                icon: 'mdi-cloud-sync',
                message: t('icloud.sync.checking.message')
            });
            
            try {
                // Track any pending changes
                trackStoreChanges();
                
                if (!syncManager.hasLocalChanges()) {
                    notifySync('info', 'icloud.sync.noChanges.message', {
                        icon: 'mdi-cloud-check',
                        timeout: 2000
                    });
                    return;
                }
            } catch (error) {
                logger.error(`[CloudSync] - Error tracking changes: ${error}`);
                notifySync('error', 'icloud.sync.error.message', {
                    type: 'negative',
                    icon: 'mdi-cloud-alert',
                    caption: 'Error tracking changes',
                    timeout: 3000
                });
                return;
            }

            const totalOperations = syncConfigs.filter(c => c.enabled).length;
            let completedOperations = 0;

            // Process each enabled sync config
            for (const config of syncConfigs) {
                if (!config.enabled) continue;

                try {
                    const latestData = await config.getLatest();
                    
                    if (latestData && latestData.data && 
                        (!settingsStore.lastSync || new Date(latestData.timestamp) > new Date(settingsStore.lastSync))) {
                        
                        // Check if there is actual data to sync
                        const hasData = config.type === 'personas' ? 
                            (latestData.data.personas && latestData.data.personas.length > 0) :
                            (config.type === 'conversations' ? 
                                (latestData.data.conversations && latestData.data.conversations.length > 0) : 
                                true);

                        if (hasData) {
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
                                    notifySync('success', `icloud.sync.${config.type}.loaded.message`, {
                                        type: 'positive',
                                        icon: 'mdi-cloud-check',
                                        timeout: 2000
                                    });
                                    resolve();
                                }).onCancel(() => resolve());
                            });
                        }
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
                        message: t(`icloud.sync.${config.type}.inProgress.message`)
                    });

                    // Perform sync
                    const currentData = config.getData();
                    await config.sync(currentData);
                    await config.cleanup();
                    
                    if (notifyRef) {
                        notifyRef();  // Dismiss upload notification
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between notifications
                    notifySync('success', `icloud.sync.${config.type}.synced.message`, {
                        type: 'positive',
                        icon: 'mdi-cloud-check',
                        timeout: 2500
                    });

                    // Update progress
                    completedOperations++;
                    syncProgress.value = (completedOperations / totalOperations) * 100;
                } catch (error) {
                    if (notifyRef) {
                        notifyRef();  // Dismiss notification
                    }

                    logger.error(`[CloudSync] - Error syncing ${config.type}: ${error}`);
                    notifySync('error', `icloud.sync.${config.type}.error.message`, {
                        type: 'negative',
                        icon: 'mdi-cloud-alert',
                        timeout: 2000
                    });
                }
            }

            // Update last sync timestamp and cleanup
            settingsStore.lastSync = new Date().toISOString();
            syncManager.clearCompleted();
            
            // Show final success notification
            if (notifyRef) {
                notifyRef();
            }
            notifySync('success', 'icloud.sync.success.message', {
                type: 'positive',
                icon: 'mdi-cloud-check',
                timeout: 2000
            });

        } catch (error) {
            logger.error(`[CloudSync] - iCloud sync error: ${error}`);
            notifySync('error', 'icloud.sync.error.message', {
                type: 'negative',
                icon: 'mdi-cloud-alert',
                caption: error.message,
                timeout: 3000
            });
        }
    }

    return {
        syncing,
        syncToCloud,
        hasUnsynced,
        syncProgress,
        syncStatus
    }
}
