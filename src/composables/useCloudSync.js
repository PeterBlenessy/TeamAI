import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSettingsStore } from '@/stores/settings-store'
import { useTeamsStore } from '@/stores/teams-store'
import iCloudService from '@/services/iCloudService'
import logger from '@/services/logger'
import { syncStateManager, SyncState, SyncType } from '@/services/syncStateManager'

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
    const trackStoreChanges = () => {
        // Personas changes
        if (settingsStore.syncOptions.personas) {
            teamsStore.personas.forEach((persona, index) => {
                syncManager.trackChange(
                    SyncType.PERSONAS,
                    `persona_${index}`,
                    persona
                )
            })
        }

        // Conversations changes
        if (settingsStore.syncOptions.conversations) {
            teamsStore.history.forEach((conv, index) => {
                syncManager.trackChange(
                    SyncType.CONVERSATIONS,
                    `conversation_${index}`,
                    conv
                )
            })
        }
    }

    // Process each type of sync
    const processSyncOperation = async (type, data) => {
        syncStatus.value = t(`icloud.sync.${type}.inProgress.message`)
        
        try {
            let latestData = null
            
            switch (type) {
                case SyncType.PERSONAS:
                    latestData = await iCloudService.getLatestPersonas()
                    break
                case SyncType.CONVERSATIONS:
                    latestData = await iCloudService.getLatestConversations()
                    break
            }

            if (latestData && (!settingsStore.lastSync || new Date(latestData.timestamp) > new Date(settingsStore.lastSync))) {
                // Compare vector clocks to detect conflicts
                const comparison = syncManager.compareVectorClocks(
                    latestData.vectorClock || {},
                    data.vectorClock || {}
                )

                if (comparison === 'concurrent') {
                    // Handle conflicts
                    const remoteData = latestData.data?.[type] || []
                    const previousData = latestData.previousVersion?.[type]

                    const resolutions = await handleConflict([
                        {
                            key: type,
                            local: data || [],
                            remote: remoteData,
                            base: previousData || []
                        }
                    ])

                    if (resolutions.length > 0) {
                        const choice = resolutions[0].choice
                        data = choice === 'local' ? data : remoteData
                    }
                }
            }

            // Sync the data
            switch (type) {
                case SyncType.PERSONAS:
                    await iCloudService.syncPersonas(data)
                    break
                case SyncType.CONVERSATIONS:
                    await iCloudService.syncConversations(data)
                    break
            }

            notifySync('success', `icloud.sync.${type}.synced.message`, {
                type: 'positive',
                icon: 'mdi-cloud-check',
                timeout: 2000
            })
        } catch (error) {
            logger.error(`[CloudSync] - Error syncing ${type}: ${error}`)
            notifySync('error', `icloud.sync.${type}.error.message`, {
                type: 'negative',
                icon: 'mdi-cloud-alert',
                timeout: 2000
            })
            throw error
        }
    }

    // Sync to cloud with improved error handling and progress tracking
    const syncToCloud = async () => {
        if (syncing.value || !iCloudService.isAvailable()) {
            return
        }

        try {
            // Start sync process
            syncProgress.value = 0
            syncStatus.value = t('icloud.sync.checking.message')
            
            try {
                // Track any pending changes
                trackStoreChanges()
                
                if (!syncManager.hasLocalChanges()) {
                    notifySync('info', 'icloud.sync.noChanges.message', {
                        icon: 'mdi-cloud-check',
                        timeout: 2000
                    })
                    return
                }
            } catch (error) {
                logger.error(`[CloudSync] - Error tracking changes: ${error}`)
                notifySync('error', 'icloud.sync.error.message', {
                    type: 'negative',
                    icon: 'mdi-cloud-alert',
                    caption: 'Error tracking changes',
                    timeout: 3000
                })
                return
            }

            // Queue sync operations
            const syncConfigs = [
                {
                    type: SyncType.PERSONAS,
                    enabled: settingsStore.syncOptions.personas,
                    data: teamsStore.personas
                },
                {
                    type: SyncType.CONVERSATIONS,
                    enabled: settingsStore.syncOptions.conversations,
                    data: teamsStore.history
                }
            ]

            const totalOperations = syncConfigs.filter(c => c.enabled).length
            let completedOperations = 0

            // Process each enabled sync config
            for (const config of syncConfigs) {
                if (!config.enabled) continue

                syncStatus.value = t(`icloud.sync.${config.type}.inProgress.message`)
                
                try {
                    await processSyncOperation(config.type, config.data)
                    
                    // Update progress
                    completedOperations++
                    syncProgress.value = (completedOperations / totalOperations) * 100
                    
                } catch (error) {
                    if (error.message === 'SYNC_CONFLICT') {
                        const resolutions = await handleConflict(
                            iCloudService._conflictResolver.conflicts
                        )
                        if (resolutions.length > 0) {
                            // Apply conflict resolutions
                            const mergedData = iCloudService._conflictResolver.resolve(resolutions)
                            // Retry sync with resolved data
                            await processSyncOperation(config.type, mergedData)
                        }
                    } else {
                        throw error
                    }
                }
            }

            // Update last sync timestamp after successful sync
            settingsStore.lastSync = new Date().toISOString()
            syncManager.clearCompleted()
            
            notifySync('success', 'icloud.sync.success.message', {
                type: 'positive',
                icon: 'mdi-cloud-check',
                timeout: 2000
            })

        } catch (error) {
            logger.error(`[CloudSync] - iCloud sync error: ${error}`)
            notifySync('error', 'icloud.sync.error.message', {
                type: 'negative',
                icon: 'mdi-cloud-alert',
                caption: error.message,
                timeout: 3000
            })
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
