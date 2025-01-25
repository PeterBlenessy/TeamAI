import { join } from '@tauri-apps/api/path'
import { homeDir } from '@tauri-apps/api/path'
import { platform } from '@tauri-apps/plugin-os'
import { readFile, create, readDir, mkdir, remove } from '@tauri-apps/plugin-fs'
import logger from '@/services/logger'
import { syncStateManager } from './syncStateManager'

const iCloudService = {
    VERSION: '1.0',
    _lockFiles: new Set(),
    _clientId: null,
    _sequenceNumber: 0,
    _lastSyncMetadata: null,
    _conflicts: null,

    // Internal state
    _isAvailable: false,
    _container: null,
    _initialized: false,

    async init() {
        try {
            if (this._isMacOS()) {
                const home = await homeDir()
                const iCloudPath = await join(home, 'Library', 'Mobile Documents')
                const iCloudDocsPath = await join(iCloudPath, 'com~apple~CloudDocs')
                this._container = await join(iCloudDocsPath, 'TeamAI')

                try {
                    await mkdir(this._container, { recursive: true })
                    logger.info(`[iCloudService] - Directories created or already exist`)
                } catch (dirError) {
                    logger.error(`[iCloudService] - Error creating directories: ${dirError}`)
                    throw dirError
                }

                await this._initializeClientId()
                await this._loadSyncMetadata()

                this._isAvailable = true
                this._initialized = true
                logger.info('[iCloudService] - Initialized successfully')
            } else {
                logger.warn('[iCloudService] - iCloud is only supported on macOS')
                this._isAvailable = false
            }
        } catch (error) {
            logger.error(`[iCloudService] - Initialization failed: ${error}`)
            this._isAvailable = false
        }
    },

    async _initializeClientId() {
        try {
            const metadataPath = await join(this._container, 'client-metadata.json')
            let metadata
            try {
                const contents = await readFile(metadataPath)
                metadata = JSON.parse(new TextDecoder().decode(contents))
            } catch (e) {
                metadata = {
                    clientId: syncStateManager.getClientId(),
                    firstSeen: new Date().toISOString()
                }
                const file = await create(metadataPath)
                await file.write(new TextEncoder().encode(JSON.stringify(metadata, null, 2)))
                await file.close()
            }
            this._clientId = metadata.clientId
        } catch (error) {
            logger.error(`[iCloudService] - Error initializing client ID: ${error}`)
            throw error
        }
    },

    async _loadSyncMetadata() {
        try {
            const syncMetadataPath = await join(this._container, 'sync-metadata.json')
            try {
                const contents = await readFile(syncMetadataPath)
                this._lastSyncMetadata = JSON.parse(new TextDecoder().decode(contents))
            } catch (e) {
                this._lastSyncMetadata = { clients: {}, vectorClock: {} }
            }
        } catch (error) {
            logger.error(`[iCloudService] - Error loading sync metadata: ${error}`)
            throw error
        }
    },

    async _updateSyncMetadata(fileType, syncTimestamp) {
        const syncMetadataPath = await join(this._container, 'sync-metadata.json')
        const vectorClock = syncStateManager.getVectorClock()
        
        this._lastSyncMetadata.clients[this._clientId] = {
            ...this._lastSyncMetadata.clients[this._clientId],
            lastSync: syncTimestamp,
            [fileType]: {
                lastSync: syncTimestamp,
                sequence: this._sequenceNumber,
                vectorClock
            }
        }

        const file = await create(syncMetadataPath)
        await file.write(new TextEncoder().encode(JSON.stringify(this._lastSyncMetadata, null, 2)))
        await file.close()
    },

    _isMacOS() {
        const platformName = platform()
        logger.info(`[iCloudService] - Current platform name: ${platformName}`)
        return platformName === 'macos'
    },

    async _ensureInitialized() {
        if (!this._initialized) {
            await this.init()
        }
    },

    isAvailable() {
        return this._isAvailable
    },

    async _acquireLock(fileName) {
        if (this._lockFiles.has(fileName)) {
            throw new Error(`File ${fileName} is locked`)
        }
        this._lockFiles.add(fileName)
        return () => this._lockFiles.delete(fileName)
    },

    _validateData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format')
        }
    },

    async saveFile(fileName, data, previousVersionData = null) {
        await this._ensureInitialized()
        if (!this._isAvailable) {
            throw new Error('iCloud is not available')
        }

        this._validateData(data)
        const releaseLock = await this._acquireLock(fileName)

        try {
            const filePath = await join(this._container, fileName)
            const file = await create(filePath)

            this._sequenceNumber++
            const timestamp = new Date().toISOString()
            const timestampMs = Date.now()

            const contentToSave = {
                version: this.VERSION,
                clientId: this._clientId,
                sequence: this._sequenceNumber,
                timestamp,
                timestampMs,
                vectorClock: syncStateManager.getVectorClock(),
                data,
                previousVersion: previousVersionData ? {
                    vectorClock: previousVersionData.vectorClock,
                    timestamp: previousVersionData.timestamp,
                    sequence: previousVersionData.sequence
                } : null
            }

            const contents = JSON.stringify(contentToSave, null, 2)
            await file.write(new TextEncoder().encode(contents))
            await file.close()
            logger.info(`[iCloudService] - Saved file: ${fileName}`)
            return true
        } catch (error) {
            logger.error(`[iCloudService] - Error saving file ${fileName}: ${error}`)
            throw error
        } finally {
            releaseLock()
        }
    },

    async readFile(fileName) {
        await this._ensureInitialized()
        if (!this._isAvailable) {
            throw new Error('iCloud is not available')
        }

        const filePath = await join(this._container, fileName)
        try {
            const contents = await readFile(filePath)
            const text = new TextDecoder().decode(contents)
            logger.info(`[iCloudService] - Read file contents from: ${fileName}`)

            try {
                return JSON.parse(text)
            } catch (parseError) {
                logger.error(`[iCloudService] - JSON parse error: ${parseError}`)
                logger.error(`[iCloudService] - Raw content: ${text}`)
                throw new Error(`Failed to parse JSON: ${parseError.message}`)
            }
        } catch (error) {
            if (error.toString().includes('No such file or directory')) {
                return null
            }
            logger.error(`[iCloudService] - Error reading file ${fileName}: ${error}`)
            throw error
        }
    },

    async listFiles() {
        await this._ensureInitialized()
        if (!this._isAvailable) {
            throw new Error('iCloud is not available')
        }

        try {
            return await readDir(this._container)
        } catch (error) {
            logger.error(`[iCloudService] - Error listing files: ${error}`)
            throw error
        }
    },

    async handleFileOperations(action, fileType, data = null, keepCount = 5) {
        await this._ensureInitialized()
        if (!this._isAvailable) {
            throw new Error('iCloud is not available')
        }

        const filePrefix = `teamai-${fileType}-`
        const files = await this.listFiles()
        const filteredFiles = files.filter(f => f.name.startsWith(filePrefix) && f.name.endsWith('.json'))

        switch (action) {
            case 'getLatest': {
                const latestFiles = await Promise.all(filteredFiles.map(async f => ({
                    file: f,
                    metadata: await this.readFile(f.name)
                })))

                const validFiles = latestFiles.filter(f => f.metadata)
                validFiles.sort((a, b) => {
                    const timeCompare = (b.metadata.timestampMs || 0) - (a.metadata.timestampMs || 0)
                    if (timeCompare !== 0) return timeCompare
                    return (b.metadata.sequence || 0) - (a.metadata.sequence || 0)
                })

                if (validFiles.length === 0) return null

                const mostRecent = validFiles[0]
                const conflicts = validFiles.filter(f => {
                    if (f === mostRecent) return false

                    // Use vector clocks for conflict detection when available
                    if (f.metadata.vectorClock && mostRecent.metadata.vectorClock) {
                        const comparison = syncStateManager.compareVectorClocks(
                            f.metadata.vectorClock,
                            mostRecent.metadata.vectorClock
                        )
                        return comparison === 'concurrent'
                    }

                    // Fall back to timestamp-based detection
                    return Math.abs((f.metadata.timestampMs || 0) - (mostRecent.metadata.timestampMs || 0)) < 60000
                        && f.metadata.clientId !== mostRecent.metadata.clientId
                })

                if (conflicts.length > 0) {
                    logger.warn(`[iCloudService] - Detected ${conflicts.length} conflicts for ${fileType}`)
                    this._conflicts = conflicts.map(f => ({
                        ...f.metadata.data,
                        vectorClock: f.metadata.vectorClock,
                        timestamp: f.metadata.timestamp
                    }))
                }

                return mostRecent.metadata
            }

            case 'cleanupOld': {
                filteredFiles.sort((a, b) => b.name.localeCompare(a.name))
                if (filteredFiles.length <= keepCount) return

                const monthlyFiles = new Map()
                const threeMonthsAgo = new Date()
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

                for (const file of filteredFiles) {
                    const dateMatch = file.name.match(/\d{4}-\d{2}-\d{2}/)
                    if (dateMatch) {
                        const fileDate = new Date(dateMatch[0])
                        const monthKey = `${fileDate.getFullYear()}-${fileDate.getMonth()}`

                        if (fileDate >= threeMonthsAgo && !monthlyFiles.has(monthKey)) {
                            monthlyFiles.set(monthKey, file)
                        }
                    }
                }

                const preserveFiles = new Set([...monthlyFiles.values()].map(f => f.name))
                const filesToDelete = filteredFiles
                    .filter(f => !preserveFiles.has(f.name))
                    .slice(keepCount)

                for (const file of filesToDelete) {
                    await remove(await join(this._container, file.name))
                    logger.info(`[iCloudService] - Deleted old ${fileType} file: ${file.name}`)
                }
                break
            }

            case 'sync': {
                const syncTimestamp = new Date().toISOString()
                const fileName = `${filePrefix}${Date.now()}_${this._clientId}.json`

                // Get latest version for vector clock comparison
                const latestVersion = await this.handleFileOperations('getLatest', fileType)

                // Ensure data exists and is an array for personas and conversations
                let syncData = data
                if ((fileType === 'personas' || fileType === 'conversations') && !Array.isArray(data)) {
                    syncData = []
                    logger.warn(`[iCloudService] - Converting ${fileType} data to array`)
                }

                await this.saveFile(fileName, {
                    timestamp: syncTimestamp,
                    [fileType]: syncData
                }, latestVersion)

                await this._updateSyncMetadata(fileType, syncTimestamp)
                return { success: true }
            }

            default:
                throw new Error('Invalid action specified')
        }
    },

    async syncSettings(settings) {
        await this.handleFileOperations('sync', 'settings', settings)
    },

    async syncPersonas(personas) {
        await this.handleFileOperations('sync', 'personas', Array.isArray(personas) ? personas : [])
    },

    async getLatestPersonas() {
        const result = await this.handleFileOperations('getLatest', 'personas')
        if (!result?.data?.personas) {
            return { data: { personas: [] } }
        }
        return result
    },

    async cleanupOldPersonas(keepCount = 5) {
        await this.handleFileOperations('cleanupOld', 'personas', null, keepCount)
    },

    async getLatestSettings() {
        return await this.handleFileOperations('getLatest', 'settings')
    },

    async cleanupOldSettings(keepCount = 5) {
        await this.handleFileOperations('cleanupOld', 'settings', null, keepCount)
    },

    async syncConversations(teamsStore) {
        const teamsState = JSON.parse(JSON.stringify(teamsStore.$state))
        const history = Array.isArray(teamsState?.history) ? teamsState.history : []
        await this.handleFileOperations('sync', 'conversations', history)
    },

    async getLatestConversations() {
        const result = await this.handleFileOperations('getLatest', 'conversations')
        if (!result?.data?.conversations) {
            return { data: { conversations: [] } }
        }
        return result
    },

    async cleanupOldConversations(keepCount = 5) {
        await this.handleFileOperations('cleanupOld', 'conversations', null, keepCount)
    }
}

iCloudService.init()

export default iCloudService
