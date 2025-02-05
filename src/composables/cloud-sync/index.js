import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '@/stores/settings-store';
import { storeToRefs } from 'pinia';
import iCloudService from '@/services/iCloudService';
import logger from '@/services/logger';
import { syncStateManager, SyncState, SyncType, ChangeType } from '@/services/syncStateManager';
import SettingsDialog from '@/components/Settings/SettingsDialog.vue';
import { createPersonasHandler } from './handlers/personas';
import { createConversationsHandler } from './handlers/conversations';
import { createImagesHandler } from './handlers/images';

export function useCloudSync() {
    const { t } = useI18n();
    const $q = useQuasar();
    const settingsStore = useSettingsStore();
    
    // Extract reactive refs from stores
    const { cloudSync, syncOptions, lastSync } = storeToRefs(settingsStore);
    
    // Reactive state
    const syncManager = syncStateManager.init();
    const syncing = computed(() => syncManager.syncState === SyncState.IN_PROGRESS);
    const hasUnsynced = computed(() => syncManager.hasLocalChanges());
    const syncProgress = ref(0);
    const syncStatus = ref('');

    // Initialize handlers
    const handlers = {
        [SyncType.PERSONAS]: createPersonasHandler(),
        [SyncType.CONVERSATIONS]: createConversationsHandler(),
        [SyncType.IMAGES]: createImagesHandler()
    };

    // Notify user about sync status
    const notifyAndLogger = (type, message, options = {}) => {
        const logTypeMap = {
            'info': logger.info,
            'success': logger.info,
            'warning': logger.warn,
            'error': logger.error,
            'negative': logger.error,
            'positive': logger.info,
        };

        const logFn = logTypeMap[type] || logger.info;
        logFn(`[CloudSync] UI Notification:`, {
            message,
            caption: options?.caption || 'no details',
        });

        return $q.notify({
            type,
            position: 'bottom-right',
            ...options,
            message
        });
    };

    // Track individual item changes
    const trackItemChange = async (type, itemId, item, changeType = ChangeType.UPDATE) => {
        if (!type || !itemId || !item) {
            const error = new Error(`Invalid parameters for trackItemChange: type=${type}, itemId=${itemId}`);
            logger.error(`[CloudSync] ${error.message}`);
            return false;
        }

        try {
            syncManager.trackChange(type, itemId, item, changeType);
            return true;
        } catch (error) {
            const errorStr = String(error || 'Unknown error tracking change');
            logger.error(`[CloudSync] Error tracking item change: ${errorStr}`);
            return false;
        }
    };

    // Track changes in stores
    const trackStoreChanges = async () => {
        for (const [type, handler] of Object.entries(handlers)) {
            if (!handler.enabled()) continue;

            try {
                const result = await handler.getChanges(lastSync.value);
                if (Array.isArray(result) && result.length > 0) {
                    for (const item of result) {
                        await trackItemChange(type, item.itemId, item.data, item.changeType);
                    }
                }
            } catch (error) {
                logger.error(`[CloudSync] Error tracking ${type} changes:`, error);
            }
        }
    };

    // Check cloud sync availability and user settings
    const checkCloudSync = () => {
        if (!iCloudService.isAvailable()) {
            notifyAndLogger('warning', t('settings.cloud.unavailable.message'), {
                icon: 'mdi-cloud-off',
                caption: t('settings.cloud.unavailable.caption'),
                timeout: 3000
            });
            return false;
        }

        if (!cloudSync.value) {
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

    // Sync to cloud with item-level tracking
    const syncToCloud = async () => {
        if (syncing.value || !checkCloudSync()) {
            return;
        }

        let currentNotification = null;

        try {
            syncManager.syncState = SyncState.IN_PROGRESS;
            logger.info('[CloudSync] Starting sync process');

            currentNotification = notifyAndLogger('info', t('icloud.sync.checking.message'), {
                timeout: 0,
                spinner: true,
                icon: 'mdi-cloud-sync'
            });

            // Track changes and sync
            await trackStoreChanges();

            for (const [type, handler] of Object.entries(handlers)) {
                if (!handler.enabled()) continue;

                const changedItems = syncManager.getChangedItems(type);
                for (const itemId of changedItems) {
                    const change = syncManager.getItemChange(type, itemId);
                    if (!change) continue;

                    try {
                        if (currentNotification) currentNotification();
                        currentNotification = notifyAndLogger('info', 
                            t(`icloud.sync.${type.toLowerCase()}.uploading.message`), {
                            timeout: 0,
                            spinner: true,
                            icon: 'mdi-cloud-upload'
                        });

                        await handler.sync(itemId, change, change.changeType);
                        syncManager.clearItemChanges(type, itemId);

                        if (currentNotification) currentNotification();
                        currentNotification = notifyAndLogger('success',
                            t(`icloud.sync.${type.toLowerCase()}.uploaded.message`), {
                            type: 'positive',
                            icon: 'mdi-cloud-check',
                            timeout: 1500
                        });
                    } catch (error) {
                        logger.error(`[CloudSync] Error syncing ${type}/${itemId}:`, error);
                        throw error;
                    }
                }
            }

            // Apply cloud changes
            for (const [type, handler] of Object.entries(handlers)) {
                if (!handler.enabled()) continue;

                if (currentNotification) currentNotification();
                currentNotification = notifyAndLogger('info', t('icloud.sync.checking.message'), {
                    timeout: 0,
                    spinner: true,
                    icon: 'mdi-cloud-download'
                });

                try {
                    const cloudChanges = await handler.getChanges(lastSync.value);
                    for (const item of cloudChanges) {
                        try {
                            await handler.applyChange(item);
                        } catch (error) {
                            logger.error(`[CloudSync] Error applying ${type} change:`, error);
                        }
                    }
                } catch (error) {
                    logger.error(`[CloudSync] Error getting ${type} changes:`, error);
                }
            }

            if (currentNotification) currentNotification();

            notifyAndLogger('success', t('icloud.sync.success.message'), {
                type: 'positive',
                icon: 'mdi-cloud-check',
                timeout: 2000
            });

            syncManager.syncState = SyncState.COMPLETED;
            lastSync.value = new Date().toISOString();
            syncManager.clearCompleted();

        } catch (error) {
            logger.error('[CloudSync] Sync failed:', error);

            if (currentNotification) currentNotification();

            notifyAndLogger('error', t('icloud.sync.error.message'), {
                type: 'negative',
                icon: 'mdi-cloud-alert',
                caption: String(error),
                timeout: 3000
            });

            syncManager.syncState = SyncState.FAILED;
        }
    };

    return {
        syncing,
        syncToCloud,
        hasUnsynced,
        syncProgress,
        syncStatus
    };
}
