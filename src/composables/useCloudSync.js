import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '@/stores/settings-store';
import { useSyncStore } from '@/stores/sync-store';
import { SyncState, SyncPhase, SyncType } from './cloudSync/sync-constants';
import { storeToRefs } from 'pinia';
import { cloudSyncService } from '@/services/cloudSyncService';
import logger from '@/services/logger';

// Import data handlers for format validation and parsing
import { validatePersona, parsePersonaData, preparePersonaData } from './cloudSync/personas';
import { validateConversation, parseConversationData, prepareConversationData } from './cloudSync/conversations';
import { validateImage, parseImageMetadata, prepareImageMetadata, getAllImageIds, getLocalImage } from './cloudSync/images';

export function useCloudSync() {
    const { t } = useI18n();
    const $q = useQuasar();
    const settingsStore = useSettingsStore();
    const syncStore = useSyncStore();
    
    // Get settings from settings store
    const { cloudSync, syncOptions } = storeToRefs(settingsStore);
    
    // Get sync state from sync store
    const { state, phase, currentItem, error, lastSync } = storeToRefs(syncStore);
    
    // Update progress state and notify
    const updateProgress = (newPhase, item = null) => {
        phase.value = newPhase;
        currentItem.value = item;
        
        if ([SyncPhase.COMPLETED, SyncPhase.ERROR].includes(newPhase)) {
            $q.notify({
                type: newPhase === SyncPhase.COMPLETED ? 'positive' : 'negative',
                message: t(`cloud.sync.phase.${newPhase}`),
                position: 'bottom-right',
                timeout: 2000
            });
        }
    };

    // Helper to get changed images
    const getChangedImages = async (since = null) => {
        try {
            const imageIds = await getAllImageIds();
            const items = [];

            for (const id of imageIds) {
                try {
                    const imageData = await getLocalImage(id);
                    if (!imageData) continue;

                    items.push({
                        id,
                        data: imageData,
                        // For now we don't track image modification times
                        lastModified: since ? new Date(since).getTime() + 1 : Date.now()
                    });
                } catch (error) {
                    logger.error('[CloudSync] Error reading local image:', { 
                        error, 
                        imageId: id
                    });
                }
            }
            return items;
        } catch (error) {
            logger.error('[CloudSync] Error listing local images:', error);
            throw error;
        }
    };

    // Helper to get changed items of a specific type
    const getChangedItems = async (type, since = null) => {
        if (type === SyncType.IMAGES) {
            return getChangedImages(since);
        }

        try {
            const files = await cloudSyncService.listFiles(type);
            const items = [];

            for (const file of files) {
                if (!file.name?.endsWith('.json')) continue;

                try {
                    const id = file.name.replace('.json', '');
                    const content = await cloudSyncService.getData(type, id);
                    if (!content) continue;

                    const data = type === SyncType.PERSONAS 
                        ? parsePersonaData(content)
                        : parseConversationData(content);

                    if (data) {
                        items.push({
                            id,
                            lastModified: file.modifiedAt,
                            data
                        });
                    }
                } catch (error) {
                    logger.error(`[CloudSync] Error reading ${type} file:`, { 
                        error, 
                        fileName: file.name
                    });
                }
            }

            if (since) {
                const sinceDate = new Date(since);
                return items.filter(item => new Date(item.lastModified) > sinceDate);
            }

            return items;
        } catch (error) {
            logger.error(`[CloudSync] Error listing ${type}:`, error);
            throw error;
        }
    };

    // Main sync function
    const syncToCloud = async ({ forceUpload = false } = {}) => {
        if (state.value === SyncState.SYNCING) {
            logger.info('[CloudSync] Sync already in progress');
            return;
        }

        try {
            // Check if cloud sync is enabled in settings first
            if (!cloudSync.value) {
                throw new Error('Please enable cloud sync in settings first');
            }

            // Check if any sync options are enabled
            if (!syncOptions.value.personas && !syncOptions.value.conversations && !syncOptions.value.images) {
                throw new Error('Please enable at least one sync option in settings');
            }

            // Check if cloud sync service is available
            if (!cloudSyncService.isAvailable()) {
                throw new Error('Cloud sync service is not available');
            }

            // Start sync
            state.value = SyncState.SYNCING;
            error.value = null;
            updateProgress(SyncPhase.STARTING);

            // Define sync function for images
            const syncImage = async (id, imageData) => {
                validateImage(imageData);
                const metadata = prepareImageMetadata(id, imageData);
                
                // Save image metadata first
                await cloudSyncService.syncData(SyncType.IMAGES, `${id}.json`, metadata);
                
                // Then save image binary data
                await cloudSyncService.syncData(SyncType.IMAGES, `${id}.bin`, imageData);
            };

            // Define sync function for a single type
            const syncType = async (type, enabled, prepareData, validateData) => {
                if (!enabled) return;
                
                updateProgress(SyncPhase.CHECKING, type);
                const changedItems = await getChangedItems(type, lastSync.value);
                
                if (changedItems.length > 0 || forceUpload) {
                    updateProgress(SyncPhase.UPLOADING, type);
                    for (const item of changedItems) {
                        if (type === SyncType.IMAGES) {
                            validateImage(item.data);
                            const metadata = prepareImageMetadata(item.id, item.data);
                            
                            // Save image metadata
                            await cloudSyncService.syncData(SyncType.IMAGES, `${item.id}.json`, metadata);
                            
                            // Save image binary data
                            await cloudSyncService.syncData(SyncType.IMAGES, `${item.id}.bin`, item.data);
                        } else {
                            validateData(item.data);
                            const syncDataObj = prepareData(item.data);
                            await cloudSyncService.syncData(type, `${item.id}.json`, syncDataObj);
                        }
                    }
                }
            };

            // Sync personas
            await syncType(SyncType.PERSONAS, 
                syncOptions.value.personas,
                preparePersonaData,
                validatePersona
            );

            // Sync conversations
            await syncType(SyncType.CONVERSATIONS,
                syncOptions.value.conversations,
                prepareConversationData,
                validateConversation
            );

            // Sync images
            if (syncOptions.value.images) {
                updateProgress(SyncPhase.CHECKING, SyncType.IMAGES);
                const changedImages = await getChangedImages(lastSync.value);
                
                if (changedImages.length > 0 || forceUpload) {
                    updateProgress(SyncPhase.UPLOADING, SyncType.IMAGES);
                    for (const item of changedImages) {
                        validateImage(item.data);
                        const metadata = prepareImageMetadata(item.id, item.data);
                        
                        // Save image metadata
                        await cloudSyncService.syncData(SyncType.IMAGES, `${item.id}.json`, metadata);
                        
                        // Save image binary data
                        await cloudSyncService.syncData(SyncType.IMAGES, `${item.id}.bin`, item.data);
                    }

                    // Clean up phase - remove any .bin files without matching .json
                    updateProgress(SyncPhase.CLEANING, SyncType.IMAGES);
                    const files = await cloudSyncService.listFiles(SyncType.IMAGES);
                    const binFiles = files.filter(f => f.name.endsWith('.bin')).map(f => f.name.replace('.bin', ''));
                    const jsonFiles = files.filter(f => f.name.endsWith('.json')).map(f => f.name.replace('.json', ''));
                    
                    // Remove any bin files without metadata
                    for (const id of binFiles) {
                        if (!jsonFiles.includes(id)) {
                            await cloudSyncService.deleteFile(SyncType.IMAGES, `${id}.bin`);
                            logger.info('[CloudSync] Removed orphaned image file:', id);
                        }
                    }
                    
                    // Remove any metadata without bin files
                    for (const id of jsonFiles) {
                        if (!binFiles.includes(id)) {
                            await cloudSyncService.deleteFile(SyncType.IMAGES, `${id}.json`);
                            logger.info('[CloudSync] Removed orphaned metadata file:', id);
                        }
                    }
                }
            }

            // Update sync state
            state.value = SyncState.COMPLETED;
            updateProgress(SyncPhase.COMPLETED);
            lastSync.value = new Date().toISOString();
            error.value = null;
        } catch (err) {
            state.value = SyncState.ERROR;
            error.value = err;
            updateProgress(SyncPhase.ERROR);
            throw err;
        } finally {
            if (state.value !== SyncState.ERROR) {
                state.value = SyncState.IDLE;
                updateProgress(SyncPhase.IDLE);
            }
        }
    };

    return {
        // State
        syncing: computed(() => state.value === SyncState.SYNCING),
        progress: computed(() => ({
            phase: phase.value,
            current: currentItem.value
        })),
        error: computed(() => error.value),
        lastSync: computed(() => lastSync.value),
        // Actions
        syncToCloud
    };
}
