import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSettingsStore } from '@/stores/settings-store'
import { useTeamsStore } from '@/stores/teams-store'
import { storeToRefs } from 'pinia'
import iCloudService from '@/services/iCloudService'
import logger from '@/services/logger'
import { syncStateManager, SyncState, SyncType, ChangeType } from '@/services/syncStateManager'
import { imageDB } from '@/services/localforage'
import SettingsDialog from '@/components/Settings/SettingsDialog.vue'

export function useCloudSync() {
    const { t } = useI18n()
    const $q = useQuasar()
    const settingsStore = useSettingsStore()
    const teamsStore = useTeamsStore()

    // Extract reactive refs from stores
    const { cloudSync, syncOptions, lastSync } = storeToRefs(settingsStore)
    const { personas, history, messages } = storeToRefs(teamsStore)
    
    // Reactive state
    const syncManager = syncStateManager.init()
    const syncing = computed(() => syncManager.syncState === SyncState.IN_PROGRESS)
    const hasUnsynced = computed(() => syncManager.hasLocalChanges())
    const syncProgress = ref(0)
    const syncStatus = ref('')

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
            const error = new Error(`Invalid parameters for trackItemChange: type=${type}, itemId=${itemId}`)
            logger.error(`[CloudSync] ${error.message}`)
            return false
        }

        try {
            syncManager.trackChange(type, itemId, item, changeType)
            return true
        } catch (error) {
            const errorStr = String(error || 'Unknown error tracking change')
            logger.error(`[CloudSync] Error tracking item change: ${errorStr}`)
            return false
        }
    }

    // Track changes in stores
    const trackStoreChanges = async () => {
        const currentLastSync = lastSync.value ? new Date(lastSync.value) : null
        const lastSyncTime = currentLastSync?.getTime() || 0
        const hasPersonas = personas.value?.some(p => p.id !== 'default')
        const hasChanges = syncManager.hasLocalChanges()

        logger.debug('[CloudSync] Starting sync check:', {
            syncTime: lastSyncTime,
            hasPersonas,
            hasChanges,
            personasCount: personas.value?.length || 0,
            personasList: personas.value?.map(p => ({ id: p.id, name: p.name })) || []
        });

        // Track personas changes
        if (syncOptions.value?.personas && Array.isArray(personas.value)) {
            logger.info('[CloudSync] Processing personas for sync')

            for (const persona of personas.value) {
                // Skip default and invalid personas
                if (!persona || !persona.id || persona.id === 'default') {
                    logger.error('[CloudSync] Invalid persona or default:', {
                        id: persona?.id,
                        isDefault: persona?.id === 'default'
                    });
                    continue;
                }

                try {
                    // Validate persona
                    if (!teamsStore.validatePersona(persona)) {
                        logger.error('[CloudSync] Invalid persona structure:', {
                            id: persona.id,
                            hasName: !!persona.name,
                            hasPrompt: !!persona.prompt,
                            isReadonly: typeof persona.readonly === 'boolean'
                        });
                        continue;
                    }

                    // Check if we should sync
                    let shouldSync = false;
                    try {
                        const cloudPersona = await iCloudService.getPersona(persona.id);
                        const cloudModified = cloudPersona?.data?.lastModified;
                        const localModified = persona.lastModified || Date.now();

                        // Should sync if:
                        // 1. No cloud version exists
                        // 2. Local version is newer than cloud version
                        // 3. Local version has different modified timestamp
                        shouldSync = !cloudPersona || 
                                   !cloudModified ||
                                   localModified > cloudModified ||
                                   localModified !== cloudModified;

                        logger.debug(`[CloudSync] Checking persona sync:`, {
                            id: persona.id,
                            localModified,
                            cloudModified,
                            shouldSync
                        });
                    } catch (error) {
                        logger.error(`[CloudSync] Error checking cloud persona: ${error}`);
                        // If we can't check cloud version, assume we should sync
                        shouldSync = true;
                    }

                    if (shouldSync) {
                        const syncData = {
                            id: persona.id,
                            name: persona.name || 'Unnamed',
                            prompt: persona.prompt || '',
                            avatar: persona.avatar || null,
                            readonly: persona.readonly || false,
                            lastModified: persona.lastModified || Date.now()
                        };

                        logger.debug(`[CloudSync] Syncing persona:`, {
                            id: syncData.id,
                            name: syncData.name,
                            lastModified: syncData.lastModified,
                            hasPrompt: !!syncData.prompt,
                            hasAvatar: !!syncData.avatar
                        });

                        const success = await trackItemChange(
                            SyncType.PERSONAS,
                            persona.id,
                            syncData
                        );

                        if (!success) {
                            logger.error(`[CloudSync] Failed to track changes for persona ${persona.id}`);
                        }
                    }
                } catch (error) {
                    logger.error(`[CloudSync] Error processing persona ${persona.id}:`, error);
                }
            }
        }

        // Track conversation changes
        if (syncOptions.value?.conversations && Array.isArray(history.value)) {
            // Filter and process conversations sequentially
            for (const conv of history.value) {
                // Validate conversation object
                if (!conv || typeof conv !== 'object') {
                    logger.error('[CloudSync] Invalid conversation object:', conv);
                    continue;
                }
                if (!conv.conversationId) {
                    logger.error('[CloudSync] Conversation missing ID:', conv);
                    continue;
                }

                const id = conv.conversationId;
                let shouldSync = false;
                try {
                    const cloudConv = await iCloudService.getConversation(conv.conversationId);
                    const cloudUpdated = cloudConv?.data?.history?.updated;
                    const localUpdated = conv.updated || conv.timestamp || Date.now();
                    
                    // Should sync if:
                    // 1. No cloud version exists
                    // 2. Local version is newer than cloud version
                    // 3. Local version has different updated timestamp
                    shouldSync = !cloudConv || 
                               !cloudUpdated ||
                               localUpdated > cloudUpdated ||
                               localUpdated !== cloudUpdated;

                    logger.debug(`[CloudSync] Checking conversation sync:`, {
                        id: conv.conversationId,
                        localTimestamp: conv.timestamp,
                        localUpdated: conv.updated,
                        cloudUpdated,
                        shouldSync
                    });
                } catch (error) {
                    logger.error(`[CloudSync] Error checking cloud conversation: ${error}`);
                    // If we can't check cloud version, assume we should sync
                    shouldSync = true;
                }

                if (shouldSync) {
                    try {
                        logger.info(`[CloudSync] Starting sync for conversation ${id}:`, {
                            localPath: await iCloudService.getItemPath('conversations', id),
                            container: iCloudService._container,
                            timestamp: conv.timestamp,
                            updated: conv.updated
                        });

                        // Get associated messages for this conversation (with null checks)
                        const convMessages = messages.value.filter(msg => 
                            msg && typeof msg === 'object' && msg.conversationId === id
                        );
                        if (!convMessages || convMessages.length === 0) {
                            logger.warn(`[CloudSync] No messages found for conversation ${id}`);
                        } else {
                            logger.info(`[CloudSync] Found ${convMessages.length} messages for conversation ${id}`);
                        }

                        // Clean and validate conversation data
                        const convData = {
                            history: {
                                ...conv,
                                timestamp: conv.timestamp,
                                conversationId: id,
                                title: conv.title || `Conversation ${id}`
                            },
                            messages: convMessages.map(msg => ({
                                ...msg,
                                conversationId: id,
                                timestamp: msg.timestamp || Date.now()
                            }))
                        };

                        logger.debug(`[CloudSync] Syncing conversation:`, {
                            id,
                            historyKeys: Object.keys(convData.history),
                            messageCount: convData.messages.length
                        });

                        // Wait for trackItemChange to complete
                        const success = await trackItemChange(
                            SyncType.CONVERSATIONS,
                            id,
                            convData,
                            conv.deleted ? ChangeType.DELETE : ChangeType.UPDATE
                        );

                        if (!success) {
                            logger.error(`[CloudSync] Failed to track changes for conversation ${id}`);
                        }
                    } catch (error) {
                        logger.error(`[CloudSync] Error processing conversation ${id}:`, error);
                    }
                }
            }
        }

            // Track image changes
            if (syncOptions.value.images) {
                try {
                    // Get all images from local DB
                    const allImages = [];
                    await imageDB.iterate(async (value, key) => {
                        try {
                            // Ensure we have both key and value
                            if (!key || !value) {
                                logger.warn('[CloudSync] Skipping empty image:', {
                                    key,
                                    hasValue: !!value
                                });
                                return;
                            }

                            // Convert to Blob if necessary
                            let imageData = value;
                            if (!(value instanceof Blob)) {
                                if (value instanceof ArrayBuffer) {
                                    imageData = new Blob([value]);
                                } else {
                                    // Try to extract any binary data
                                    const binaryData = value.data || value.buffer || value;
                                    if (binaryData instanceof ArrayBuffer) {
                                        imageData = new Blob([binaryData]);
                                    } else {
                                        throw new Error(`Cannot convert ${value?.constructor?.name} to Blob`);
                                    }
                                }
                                logger.debug('[CloudSync] Converted image data to Blob:', {
                                    key,
                                    originalType: value?.constructor?.name,
                                    size: imageData.size
                                });
                            }

                            // Verify we have valid binary data
                            if (imageData.size === 0) {
                                throw new Error('Empty image data');
                            }

                            allImages.push({ key, value: imageData });
                        } catch (error) {
                            logger.warn('[CloudSync] Skipping invalid image:', {
                                key,
                                error: String(error),
                                type: value?.constructor?.name
                            });
                        }
                    });

                    logger.info(`[CloudSync] Processing ${allImages.length} valid images for sync`);

                    // Process each image
                    for (const { key, value } of allImages) {
                        try {

                            // Image data validation already done during collection
                            if (!value || value.size === 0) {
                                throw new Error('Invalid or empty image data');
                            }

                            // Check if we should sync
                            let shouldSync = false;
                            try {
                                const cloudImage = await iCloudService.getItem('images', key);
                                const cloudModified = cloudImage?.data?.lastModified;
                                const localModified = value.lastModified || Date.now();

                                // Should sync if:
                                // 1. No cloud version exists
                                // 2. Local version is newer than cloud version
                                // 3. Local version has different modified timestamp
                                shouldSync = !cloudImage || 
                                           !cloudModified ||
                                           localModified > cloudModified ||
                                           localModified !== cloudModified;

                                logger.debug(`[CloudSync] Checking image sync:`, {
                                    key,
                                    localModified,
                                    cloudModified,
                                    shouldSync,
                                    dataType: value.constructor.name,
                                    byteLength: value.byteLength || value.size
                                });
                            } catch (error) {
                                logger.error(`[CloudSync] Error checking cloud image: ${error}`);
                                // If we can't check cloud version, assume we should sync
                                shouldSync = true;
                            }

                            if (shouldSync) {
                            logger.debug(`[CloudSync] Syncing image:`, {
                                key,
                                size: value.byteLength || value.length,
                                hasModified: !!value.lastModified
                            });

                            const success = await trackItemChange(
                                SyncType.IMAGES,
                                key,
                                value
                            );

                            if (!success) {
                                logger.error(`[CloudSync] Failed to track changes for image ${key}`);
                            }
                        }
                    } catch (error) {
                        logger.error(`[CloudSync] Error processing image ${key}:`, error);
                    }
                }
            } catch (error) {
                logger.error(`[CloudSync] Error tracking image changes: ${error}`);
            }
        }

        // Update sync status
        logger.debug('[CloudSync] Final sync status:', {
            hasPersonas,
            hasChanges,
            personasCount: personas.value?.length || 0,
            personasList: personas.value?.map(p => ({ id: p.id, name: p.name })) || [],
            changesCount: syncManager.getChangedItems(SyncType.PERSONAS).length,
            changes: syncManager.getChangedItems(SyncType.PERSONAS)
        });
    }

    // Define sync handlers
    const syncHandlers = {
        [SyncType.PERSONAS]: {
            enabled: () => syncOptions.value.personas,
            sync: async (itemId, data, changeType) => {
                await iCloudService.syncPersona(itemId, data, changeType)
            },
            getChanges: () => iCloudService.getChangedPersonas(lastSync.value),
            applyChange: (item) => {
                if (!item.data || !item.itemId) {
                    logger.error('[CloudSync] Invalid persona data from cloud:', item);
                    return;
                }

                const personaData = {
                    id: item.itemId,
                    name: item.data.name,
                    prompt: item.data.prompt,
                    avatar: item.data.avatar,
                    readonly: item.data.readonly || false,
                    lastModified: item.data.lastModified || Date.now()
                };

                if (teamsStore.validatePersona(personaData)) {
                    const existing = personas.value.findIndex(p => p.id === item.itemId);
                    if (existing >= 0) {
                        personas.value[existing] = personaData;
                    } else {
                        personas.value.push(personaData);
                    }
                } else {
                    logger.error('[CloudSync] Invalid persona data structure:', personaData);
                }
            }
        },
        [SyncType.CONVERSATIONS]: {
            enabled: () => syncOptions.value.conversations,
            sync: async (itemId, data, changeType) => {
                await iCloudService.syncConversation(itemId, data, changeType)
            },
            getChanges: () => iCloudService.getChangedConversations(lastSync.value),
            applyChange: (item) => {
                // Update history entry
                // Initialize and clean history array
                if (!Array.isArray(history.value)) {
                    history.value = [];
                }
                
                // Filter out any null/undefined entries and find the index
                history.value = history.value.filter(h => h && typeof h === 'object');
                const historyIndex = history.value.findIndex(c => c.conversationId === item.itemId)
                if (historyIndex >= 0) {
                    history.value[historyIndex] = {
                        ...item.data.history,
                        conversationId: item.itemId
                    }
                } else {
                    history.value.push({
                        ...item.data.history,
                        conversationId: item.itemId
                    })
                }
                logger.debug('[CloudSync] Updated history array:', {
                    count: history.value.length,
                    updatedIndex: historyIndex
                });

                // Update messages
                if (!Array.isArray(messages.value)) {
                    messages.value = [];
                }
                // First remove any existing messages for this conversation
                // Clean messages array first
                messages.value = messages.value.filter(m => m && typeof m === 'object');
                const otherMessages = messages.value.filter(m => 
                    m && typeof m === 'object' && m.conversationId !== item.itemId
                )
                // Then add the synced messages
                messages.value = [
                    ...otherMessages,
                    ...(item.data.messages || []).map(msg => ({
                        ...msg,
                        conversationId: item.itemId
                    }))
                ]
                logger.debug('[CloudSync] Updated messages array:', {
                    totalCount: messages.value.length,
                    syncedCount: item.data.messages?.length || 0
                });
            }
        },
        [SyncType.IMAGES]: {
            enabled: () => syncOptions.value.images,
            sync: async (itemId, data) => {
                await iCloudService.syncImage(itemId, data)
            },
            getChanges: () => iCloudService.importCloudImages(),
            applyChange: () => {} // Handled by importCloudImages
        }
    }

    // Check cloud sync availability and user settings
    const checkCloudSync = () => {
        if (!iCloudService.isAvailable()) {
            notifyAndLogger('warning', t('settings.cloud.unavailable.message'), {
                icon: 'mdi-cloud-off',
                caption: t('settings.cloud.unavailable.caption'),
                timeout: 3000
            })
            return false
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
                })
            })
            return false
        }

        return true
    }

    // Sync to cloud with item-level tracking
    const syncToCloud = async () => {
        if (syncing.value || !checkCloudSync()) {
            return;
        }

        let currentNotification = null; // Track current notification

        const handleSyncError = (error, type, itemId) => {
            const errorStr = String(error || 'Unknown error');
            logger.error(`[CloudSync] Error syncing ${type}/${itemId}:`, {
                error: errorStr,
                errorType: error?.constructor?.name,
                stack: error?.stack,
                itemId,
                type
            });

            // Show appropriate error message with details
            const caption = errorStr.includes('Data validation failed') ? 
                `Validation error: ${errorStr}` : errorStr;

            if (currentNotification) {
                currentNotification();
            }

            currentNotification = notifyAndLogger('error', t(`icloud.sync.error.${type}.message`), {
                type: 'negative',
                icon: 'mdi-cloud-alert',
                caption: caption,
                timeout: 5000
            });
        };

        try {
            syncManager.syncState = SyncState.IN_PROGRESS;
            logger.info('[CloudSync] Starting sync process');

            // Show initial notification
            currentNotification = notifyAndLogger('info', t('icloud.sync.checking.message'), {
                timeout: 0,
                spinner: true,
                icon: 'mdi-cloud-sync'
            });

            // Track changes and get status
            const hasPersonas = personas.value?.some(p => p.id !== 'default')
            const hasChanges = syncManager.hasLocalChanges()

            try {
                await trackStoreChanges();
            } catch (error) {
                const errorStr = String(error || 'Unknown error');
                logger.error(`[CloudSync] Error tracking changes:`, {
                    error: errorStr,
                    errorType: error?.constructor?.name,
                    stack: error?.stack,
                    hasPersonas,
                    hasChanges
                });
                throw new Error(`Failed to track changes: ${errorStr}`);
            }

            // Force sync of all personas on first sync
            if (hasPersonas && !lastSync.value) {
                logger.info('[CloudSync] First sync - syncing all personas')
                const validPersonas = personas.value.filter(p => p.id !== 'default')
                for (const persona of validPersonas) {
                    await syncHandlers[SyncType.PERSONAS].sync(
                        persona.id, 
                        persona,
                        ChangeType.UPDATE
                    )
                }
            }

            // Then sync tracked changes
            for (const type of Object.values(SyncType)) {
                const handler = syncHandlers[type]
                if (!handler.enabled()) {
                    logger.debug(`[CloudSync] Sync type ${type} is disabled`)
                    continue
                }

                const changedItems = syncManager.getChangedItems(type)
                logger.debug(`[CloudSync] Processing ${changedItems.length} changes for ${type}`)

                for (const itemId of changedItems) {
                    const change = syncManager.getItemChange(type, itemId)
                    if (!change) {
                        logger.warn(`[CloudSync] No change data found for ${type}/${itemId}`)
                        continue
                    }

                    try {
                        // Update notification for current item
                        if (currentNotification) {
                            currentNotification();
                        }
                        currentNotification = notifyAndLogger('info', t(`icloud.sync.${type.toLowerCase()}.uploading.message`), {
                            timeout: 0,
                            spinner: true,
                            icon: 'mdi-cloud-upload'
                        });

                        logger.debug(`[CloudSync] Syncing ${type}/${itemId}:`, {
                            changeType: change.changeType,
                            data: change
                        });

                        await handler.sync(itemId, change, change.changeType);

                    // Verify the file actually exists in iCloud after sync
                    const verifySync = await iCloudService.getItem(type, itemId);
                    if (!verifySync) {
                        throw new Error('Sync verification failed - file not found after sync');
                    }

                    logger.info(`[CloudSync] Successfully synced ${type}/${itemId}`);
                    
                    // Only clear changes and show success after verifying
                    syncManager.clearItemChanges(type, itemId);
                    
                    // Show success notification
                    if (currentNotification) {
                        currentNotification();
                    }
                    currentNotification = notifyAndLogger('success', t(`icloud.sync.${type.toLowerCase()}.uploaded.message`), {
                        type: 'positive',
                        icon: 'mdi-cloud-check',
                        timeout: 1500
                    });
                    } catch (error) {
                        handleSyncError(error, type, itemId);
                        // Optionally throw to stop sync process
                        throw error;
                    }
                }
            }

            // Then check for and apply cloud changes
            for (const type of Object.values(SyncType)) {
                const handler = syncHandlers[type]
                if (!handler.enabled()) continue

                if (currentNotification) {
                    currentNotification();
                }
                currentNotification = notifyAndLogger('info', t('icloud.sync.checking.message'), {
                    timeout: 0,
                    spinner: true,
                    icon: 'mdi-cloud-download',
                });

                try {
                    const cloudChanges = await handler.getChanges()
                    if (!cloudChanges || cloudChanges.length === 0) continue

                    for (const item of cloudChanges) {
                        if (currentNotification) {
                            currentNotification();
                        }
                        currentNotification = notifyAndLogger('info', t(`icloud.sync.${type.toLowerCase()}.downloading.message`), {
                            timeout: 0,
                            spinner: true,
                            icon: 'mdi-cloud-download'
                        });

                        try {
                            await handler.applyChange(item);
                            if (currentNotification) {
                                currentNotification();
                            }
                            currentNotification = notifyAndLogger('success', t(`icloud.sync.${type.toLowerCase()}.downloaded.message`), {
                                type: 'positive',
                                icon: 'mdi-cloud-check',
                                timeout: 1500
                            });
                        } catch (error) {
                            logger.error(`[CloudSync] Error applying ${type} ${item.itemId}: ${error}`);
                        }
                    }
                } catch (error) {
                    logger.error(`[CloudSync] Error getting cloud changes for ${type}: ${error}`);
                }
            }

            // Clean up final notification
            if (currentNotification) {
                currentNotification();
            }

            // Show completion notification
            notifyAndLogger('success', t('icloud.sync.success.message'), {
                type: 'positive',
                icon: 'mdi-cloud-check',
                timeout: 2000
            });

            // Update sync state
            syncManager.syncState = SyncState.COMPLETED;
            lastSync.value = new Date().toISOString();
            syncManager.clearCompleted();

            logger.info('[CloudSync] Sync completed successfully');

        } catch (error) {
            const errorStr = String(error || 'Unknown sync error');
            logger.error(`[CloudSync] Sync failed:`, {
                error: errorStr,
                errorType: error?.constructor?.name,
                stack: error?.stack,
                state: syncManager.syncState
            });

            if (currentNotification) {
                currentNotification();
            }

            notifyAndLogger('error', t('icloud.sync.error.message'), {
                type: 'negative',
                icon: 'mdi-cloud-alert',
                caption: errorStr,
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
    }
}
