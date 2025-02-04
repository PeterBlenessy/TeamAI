import { homeDir, join } from '@tauri-apps/api/path'
import { platform } from '@tauri-apps/plugin-os';
import { readFile, writeFile, readDir, mkdir, remove } from '@tauri-apps/plugin-fs'
import logger from '@/services/logger'
import { syncStateManager } from './syncStateManager'
import { imageDB } from '@/services/localforage'

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
            // First clean up any leftover test files from previous runs
            try {
                const dirs = ['personas', 'conversations', 'images']
                for (const dir of dirs) {
                    const testPath = await join(this._container || '', dir, 'test.tmp')
                    try {
                        await remove(testPath)
                        logger.debug(`[iCloudService] Cleaned up leftover test file: ${testPath}`)
                    } catch (e) {
                        // Ignore errors since file may not exist
                    }
                }
            } catch (e) {
                // Continue initialization even if cleanup fails
                logger.warn('[iCloudService] Error cleaning up leftover test files:', e)
            }

            const platformName = platform()
            logger.info(`[iCloudService] - Initializing with platform: ${platformName}`)
            
            if (this._isMacOS()) {
                const home = await homeDir()
                logger.info(`[iCloudService] - Home directory: ${home}`)
                const iCloudPath = await join(home, 'Library', 'Mobile Documents')
                logger.info(`[iCloudService] - iCloud path: ${iCloudPath}`)
                const iCloudDocsPath = await join(iCloudPath, 'com~apple~CloudDocs')
                this._container = await join(iCloudDocsPath, 'TeamAI')

                try {
                    logger.info(`[iCloudService] - Setting up iCloud container at: ${this._container}`);
                    
                    // Test all parent directories
                    const libraryPath = await join(home, 'Library')
                    const mobilePath = await join(libraryPath, 'Mobile Documents')
                    const iCloudDriveRoot = await join(mobilePath, 'com~apple~CloudDocs')

                    // Test Library access
                    try {
                        const libraryTest = await readDir(libraryPath)
                        logger.info(`[iCloudService] - Library accessible with ${libraryTest.length} items`)
                    } catch (error) {
                        logger.error(`[iCloudService] - Error accessing Library:`, {
                            path: libraryPath,
                            error: String(error),
                            type: error.constructor.name
                        })
                    }

                    // Test Mobile Documents access
                    try {
                        const mobileTest = await readDir(mobilePath)
                        logger.info(`[iCloudService] - Mobile Documents accessible with ${mobileTest.length} items`)
                    } catch (error) {
                        logger.error(`[iCloudService] - Error accessing Mobile Documents:`, {
                            path: mobilePath,
                            error: String(error),
                            type: error.constructor.name
                        })
                    }

                    // Test iCloud Drive access
                    try {
                        // Test if the iCloud directory exists
                        try {
                            const dirExists = await readDir(iCloudPath)
                            logger.info(`[iCloudService] - Mobile Documents exists with ${dirExists.length} items`);
                        } catch (error) {
                            logger.error(`[iCloudService] - Mobile Documents access error:`, {
                                path: iCloudPath,
                                error: String(error)
                            });
                        }

                        // Try to list iCloud Drive contents
                        const iCloudTest = await readDir(iCloudDriveRoot)
                        logger.info(`[iCloudService] - iCloud Drive accessible at ${iCloudDriveRoot} with ${iCloudTest.length} items`);

                        // Log some accessible files to verify permissions
                        const filesList = iCloudTest.slice(0, 3).map(f => f.name)
                        logger.info(`[iCloudService] - Sample files in iCloud Drive:`, filesList);
                    } catch (error) {
                        logger.error(`[iCloudService] - Error accessing iCloud Drive:`, {
                            path: iCloudDriveRoot,
                            error: String(error),
                            type: error.constructor.name,
                            permissionError: error.message?.toLowerCase().includes('permission'),
                            notFoundError: error.message?.toLowerCase().includes('not found'),
                            stack: error.stack
                        });
                        throw error;
                    }
                    
                    // Create main container
                    await mkdir(this._container, { recursive: true })
                    const containerExists = await readDir(this._container)
                    logger.info(`[iCloudService] - Container created with ${containerExists.length} items`);
                    

                    // Create and validate subdirectories
                    const dirs = ['personas', 'conversations', 'images']
                    logger.info(`[iCloudService] - Starting directory validation for:`, dirs);

                    const validateDirectory = async (dir) => {
                        const path = await join(this._container, dir)
                        logger.info(`[iCloudService] - Validating directory: ${path}`);

                        // First ensure directory exists
                        await mkdir(path, { recursive: true })
                        logger.debug(`[iCloudService] - Created directory: ${path}`);

                        const testFileName = 'test.tmp'
                        const testFilePath = await join(path, testFileName)
                        
                        try {
                            // Retry logic for file operations
                            const retry = async (operation, description, maxAttempts = 3) => {
                                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                                    try {
                                        logger.debug(`[iCloudService] - Attempting ${description} (attempt ${attempt}/${maxAttempts})`)
                                        const result = await operation()
                                        logger.debug(`[iCloudService] - Successfully completed ${description}`)
                                        return result
                                    } catch (error) {
                                        if (attempt === maxAttempts) throw error
                                        logger.warn(`[iCloudService] - Failed ${description} (attempt ${attempt}/${maxAttempts}):`, String(error))
                                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
                                    }
                                }
                            }

                            // Write and verify test file with retries
                            await retry(
                                async () => {
                                    await writeFile(testFilePath, new TextEncoder().encode('test'))
                                    await new Promise(resolve => setTimeout(resolve, 100))
                                    
                                    const canRead = await readFile(testFilePath)
                                    if (!canRead) {
                                        throw new Error('Read verification failed')
                                    }
                                    return true
                                },
                                `write/verify test file ${testFilePath}`
                            )
                            
                        } catch (error) {
                            logger.error(`[iCloudService] - Directory validation failed for ${dir}:`, {
                                error: String(error),
                                path: testFilePath
                            })
                            throw new Error(`Directory ${dir} is not writable: ${error.message}`)
                        } finally {
                            try {
                            // Clean up test file with verification
                            logger.debug(`[iCloudService] - Cleaning up test file: ${testFilePath}`)
                            await remove(testFilePath)
                            // Verify removal
                            for (let i = 0; i < 3; i++) {
                                try {
                                    await readFile(testFilePath)
                                    // If we can still read it, wait and try remove again
                                    await new Promise(resolve => setTimeout(resolve, 500))
                                    await remove(testFilePath)
                                } catch (error) {
                                    if (error.message.toLowerCase().includes('no such file')) {
                                        logger.debug(`[iCloudService] - Successfully cleaned up test file: ${testFilePath}`)
                                        return
                                    }
                                }
                            }
                            throw new Error(`Failed to clean up test file: ${testFilePath}`)
                            } catch (cleanupError) {
                                logger.warn(`[iCloudService] - Failed to clean up test file:`, {
                                    error: String(cleanupError),
                                    path: testFilePath
                                })
                            }
                        }

                        logger.info(`[iCloudService] - Successfully validated directory: ${path}`)
                        return path
                    }

                    // Validate directories sequentially
                    logger.info(`[iCloudService] - Starting sequential directory validation`)
                    const results = []
                    for (const dir of dirs) {
                        const result = await validateDirectory(dir)
                        results.push(result)
                    }
                    logger.info(`[iCloudService] - All directories validated:`, results)
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
                logger.warn(`[iCloudService] - iCloud is only supported on macOS (detected: ${platformName})`)
                this._isAvailable = false
            }
        } catch (error) {
            logger.error(`[iCloudService] - Initialization failed:`, {
                error: String(error),
                stack: error.stack,
                type: error.constructor.name
            })
            this._isAvailable = false
        }
    },

    async _initializeClientId() {
        // Retry logic for file operations
        const retry = async (operation, description, maxAttempts = 3) => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    logger.debug(`[iCloudService] - Attempting ${description} (attempt ${attempt}/${maxAttempts})`)
                    const result = await operation()
                    logger.debug(`[iCloudService] - Successfully completed ${description}`)
                    return result
                } catch (error) {
                    if (attempt === maxAttempts) throw error
                    logger.warn(`[iCloudService] - Failed ${description} (attempt ${attempt}/${maxAttempts}):`, String(error))
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
                }
            }
        }

        try {
            const metadataPath = await join(this._container, 'client-metadata.json')
            logger.debug(`[iCloudService] - Initializing client ID at: ${metadataPath}`)

            let metadata
            try {
                // Attempt to read existing metadata with retries
                const contents = await retry(async () => {
                    const content = await readFile(metadataPath)
                    if (!content) throw new Error('Empty metadata file')
                    return content
                }, 'read client metadata')

                metadata = JSON.parse(new TextDecoder().decode(contents))
                logger.debug(`[iCloudService] - Loaded existing client metadata:`, {
                    clientId: metadata.clientId,
                    firstSeen: metadata.firstSeen
                })
            } catch (e) {
                // Create new metadata if file doesn't exist or is invalid
                metadata = {
                    clientId: syncStateManager.getClientId(),
                    firstSeen: new Date().toISOString()
                }
                logger.debug(`[iCloudService] - Creating new client metadata:`, metadata)

                // Write new metadata file with retries
                await retry(async () => {
                    const content = new TextEncoder().encode(JSON.stringify(metadata, null, 2))
                    await writeFile(metadataPath, content)
                    await new Promise(resolve => setTimeout(resolve, 100))

                    // Verify the write
                    const verifyContent = await readFile(metadataPath)
                    if (!verifyContent) {
                        throw new Error('Metadata file verification failed - file is empty')
                    }
                    return true
                }, 'write new client metadata')
            }

            this._clientId = metadata.clientId
            logger.info(`[iCloudService] - Successfully initialized client ID: ${this._clientId}`)
        } catch (error) {
            logger.error(`[iCloudService] - Error initializing client ID:`, {
                error: String(error),
                stack: error.stack,
                type: error.constructor.name
            })
            throw new Error(`Failed to initialize client ID: ${error.message}`)
        }
    },

    async _loadSyncMetadata() {
        // Retry logic for file operations
        const retry = async (operation, description, maxAttempts = 3) => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    logger.debug(`[iCloudService] - Attempting ${description} (attempt ${attempt}/${maxAttempts})`)
                    const result = await operation()
                    logger.debug(`[iCloudService] - Successfully completed ${description}`)
                    return result
                } catch (error) {
                    if (attempt === maxAttempts) throw error
                    logger.warn(`[iCloudService] - Failed ${description} (attempt ${attempt}/${maxAttempts}):`, String(error))
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
                }
            }
        }

        try {
            const syncMetadataPath = await join(this._container, 'sync-metadata.json')
            logger.debug(`[iCloudService] - Loading sync metadata from: ${syncMetadataPath}`)

            try {
                // Attempt to read existing metadata with retries
                const contents = await retry(async () => {
                    const content = await readFile(syncMetadataPath)
                    if (!content) {
                        // Return default metadata for empty file
                        return new TextEncoder().encode(JSON.stringify({ clients: {}, vectorClock: {} }))
                    }
                    return content
                }, 'read sync metadata')

                this._lastSyncMetadata = JSON.parse(new TextDecoder().decode(contents))
                logger.debug(`[iCloudService] - Loaded sync metadata:`, {
                    clientCount: Object.keys(this._lastSyncMetadata.clients || {}).length,
                    hasVectorClock: !!this._lastSyncMetadata.vectorClock
                })
            } catch (e) {
                // Create new metadata if file doesn't exist or is invalid
                this._lastSyncMetadata = { clients: {}, vectorClock: {} }
                logger.debug(`[iCloudService] - Creating new sync metadata`, this._lastSyncMetadata)

                // Write new metadata file with retries
                await retry(async () => {
                    const content = new TextEncoder().encode(JSON.stringify(this._lastSyncMetadata, null, 2))
                    await writeFile(syncMetadataPath, content)
                    await new Promise(resolve => setTimeout(resolve, 100))

                    // Verify the write
                    const verifyContent = await readFile(syncMetadataPath)
                    if (!verifyContent) {
                        throw new Error('Sync metadata file verification failed - file is empty')
                    }
                    return true
                }, 'write new sync metadata')
            }

            logger.info(`[iCloudService] - Successfully loaded sync metadata`)
        } catch (error) {
            logger.error(`[iCloudService] - Error loading sync metadata:`, {
                error: String(error),
                stack: error.stack,
                type: error.constructor.name
            })
            throw new Error(`Failed to load sync metadata: ${error.message}`)
        }
    },

    async _updateSyncMetadata(fileType, syncInfo) {
        const syncMetadataPath = await join(this._container, 'sync-metadata.json')
        const vectorClock = syncStateManager.getVectorClock()
        
        logger.debug('[iCloudService] Updating sync metadata:', {
            fileType,
            itemId: syncInfo.itemId,
            changeType: syncInfo.changeType
        });
        
        // Extract timestamp from sync info or use current time
        const timestamp = typeof syncInfo === 'object' ? 
            syncInfo.timestamp || new Date().toISOString() :
            new Date().toISOString()

        // Update metadata in memory first
        this._lastSyncMetadata.clients[this._clientId] = {
            ...this._lastSyncMetadata.clients[this._clientId],
            lastSync: timestamp,
            [fileType]: {
                lastSync: timestamp,
                itemId: syncInfo.itemId,
                changeType: syncInfo.changeType,
                sequence: this._sequenceNumber,
                vectorClock: syncInfo.vectorClock || vectorClock
            }
        }

        // Retry logic for file operations
        const retry = async (operation, description, maxAttempts = 3) => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    logger.debug(`[iCloudService] - Attempting ${description} (attempt ${attempt}/${maxAttempts})`)
                    const result = await operation()
                    logger.debug(`[iCloudService] - Successfully completed ${description}`)
                    return result
                } catch (error) {
                    if (attempt === maxAttempts) throw error
                    logger.warn(`[iCloudService] - Failed ${description} (attempt ${attempt}/${maxAttempts}):`, String(error))
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
                }
            }
        }

        try {
            // Write metadata file with retries
            await retry(async () => {
                const content = new TextEncoder().encode(JSON.stringify(this._lastSyncMetadata, null, 2))
                
                // Write the file
                await writeFile(syncMetadataPath, content)
                await new Promise(resolve => setTimeout(resolve, 100))

                // Verify file was written correctly
                const verifyContent = await readFile(syncMetadataPath)
                if (!verifyContent) {
                    throw new Error('Metadata file verification failed - file is empty')
                }

                return true
            }, `write sync metadata for ${fileType}`)

            logger.debug(`[iCloudService] Successfully updated sync metadata for:`, {
                fileType,
                itemId: syncInfo.itemId
            })
        } catch (error) {
            logger.error(`[iCloudService] Failed to update sync metadata:`, {
                error: String(error),
                fileType,
                itemId: syncInfo.itemId,
                stack: error.stack
            })
            throw new Error(`Failed to update sync metadata: ${error.message}`)
        }
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

    _validatePersona(data) {
        try {
            // Log incoming data structure
            logger.debug('[iCloudService] Validating persona:', {
                incoming: {
                    hasId: !!data.id,
                    hasName: !!data.name,
                    hasPrompt: !!data.prompt,
                    fields: Object.keys(data)
                }
            });

            // Only id is absolutely required
            if (!data.id) {
                throw new Error('Persona must have an id');
            }

            // Normalize data - ensure required fields exist with defaults
            const normalized = {
                id: data.id,
                name: data.name || 'Unnamed',
                prompt: data.prompt || '',
                readonly: data.readonly ?? true,
                lastModified: data.lastModified || Date.now(),
                // Preserve any additional fields that may exist
                ...data
            };

            // Log if any normalization was needed
            if (JSON.stringify(data) !== JSON.stringify(normalized)) {
                logger.info('[iCloudService] Persona data normalized:', {
                    added: Object.keys(normalized).filter(k => !data.hasOwnProperty(k)),
                    original: data,
                    normalized
                });
                Object.assign(data, normalized);
            }

            return true;
        } catch (error) {
            logger.error('[iCloudService] Persona validation error:', error);
            throw error;
        }
    },

    _validateConversation(data) {
        try {
            // Log incoming data structure
            logger.debug('[iCloudService] Validating conversation:', {
                incoming: {
                    hasHistory: !!data.history,
                    hasMessages: !!data.messages,
                    messageCount: data.messages?.length || 0,
                    historyFields: data.history ? Object.keys(data.history) : [],
                    fields: Object.keys(data)
                }
            });

            // Normalize messages array if missing
            if (!data.messages) {
                data.messages = [];
                logger.info('[iCloudService] Added missing messages array');
            }

            // Ensure history object exists
            if (!data.history) {
                data.history = {};
                logger.info('[iCloudService] Added missing history object');
            }

            // Get or create conversationId
            const conversationId = data.history.conversationId || 
                                 data.messages[0]?.conversationId ||
                                 Date.now().toString();
            
            // Normalize history data
            data.history = {
                title: data.history.title || 'Untitled Conversation',
                timestamp: data.history.timestamp || Date.now().toString(),
                created: data.history.created || Date.now().toString(),
                updated: data.history.updated || Date.now().toString(),
                conversationId: conversationId,
                personas: data.history.personas || [],
                readonly: data.history.readonly ?? false,
                messageLog: data.history.messageLog || {
                    added: [],
                    deleted: [],
                    lastSyncedMessageCount: data.messages?.length || 0
                },
                // Preserve any additional history fields
                ...data.history
            };

            // Ensure all messages have required fields
            data.messages = data.messages.map(msg => ({
                role: msg.role || 'user',
                content: msg.content || '',
                timestamp: msg.timestamp || Date.now().toString(),
                conversationId: msg.conversationId || conversationId,
                // Preserve existing message fields
                ...msg
            }));

            // Add standard fields if missing
            const normalized = {
                history: data.history,
                messages: data.messages,
                changeType: data.changeType || 'update',
                version: data.version || 1,
                timestamp: data.timestamp || Date.now(),
                vectorClock: data.vectorClock || {},
                // Preserve any additional top-level fields
                ...data
            };

            // Log normalization changes
            if (JSON.stringify(data) !== JSON.stringify(normalized)) {
                logger.info('[iCloudService] Conversation data normalized:', {
                    added: Object.keys(normalized).filter(k => !data.hasOwnProperty(k)),
                    modified: Object.keys(data).filter(k => JSON.stringify(data[k]) !== JSON.stringify(normalized[k]))
                });
                Object.assign(data, normalized);
            }

            return true;
        } catch (error) {
            logger.error('[iCloudService] Conversation validation error:', error);
            throw error;
        }
    },

    _validateData(data) {
        try {
            // Keep detailed logging
            logger.debug('[iCloudService] Validating data:', {
                rawData: data,
                type: typeof data,
                keys: data ? Object.keys(data) : [],
                prototype: data ? Object.getPrototypeOf(data) : null
            });

            if (!data || typeof data !== 'object') {
                throw new Error(`Invalid data: received ${data}`);
            }

            // Determine data type and use appropriate validator
            if (data.history && data.messages) {
                return this._validateConversation(data);
            } else if (data.id && (data.prompt || data.name)) {
                return this._validatePersona(data);
            }

            throw new Error('Unknown data type or invalid structure');
        } catch (error) {
            const errorStr = String(error || 'Unknown validation error');
            logger.error('[iCloudService] Data validation error:', {
                error: errorStr,
                errorType: error?.constructor?.name,
                stack: error?.stack,
                receivedData: data,
                dataType: typeof data,
                keys: data ? Object.keys(data) : []
            });
            throw new Error(`Data validation failed: ${errorStr}`);
        }
    },

    async getItemPath(type, itemId) {
        await this._ensureInitialized()
        return join(this._container, type, `${itemId}.json`)
    },

    async syncItem(type, itemId, data, changeType) {
        logger.debug(`[iCloudService] Starting sync:`, {
            type,
            itemId,
            changeType,
            data: data ? {
                id: data.id,
                name: data.name,
                hasPrompt: !!data.prompt,
                hasAvatar: !!data.avatar,
                lastModified: data.lastModified
            } : null
        });

        await this._ensureInitialized();
        if (!this._isAvailable) {
            throw new Error('iCloud is not available');
        }

        try {
            this._validateData(data);

            // Ensure directory exists
            const dirPath = await join(this._container, type);
            try {
                const dirInfo = await mkdir(dirPath, { recursive: true });
                logger.debug(`[iCloudService] - Directory status:`, dirPath, dirInfo);
            } catch (dirError) {
                logger.error(`[iCloudService] - Failed to ensure directory: ${dirPath}`, dirError);
                throw new Error(`Failed to create directory: ${dirError}`);
            }

            const itemPath = await this.getItemPath(type, itemId);
            logger.info(`[iCloudService] Writing file at: ${itemPath} (container: ${this._container})`);

            // Create metadata
            const timestamp = new Date().toISOString()
            const metadata = {
                version: this.VERSION,
                clientId: this._clientId,
                timestamp,
                timestampMs: Date.now(),
                vectorClock: syncStateManager.getVectorClock(),
                changeType,
                data: JSON.parse(JSON.stringify(data)) // Deep clone
            };

            logger.debug(`[iCloudService] Preparing metadata:`, {
                path: itemPath,
                type,
                itemId,
                timestamp,
                metadataSize: JSON.stringify(metadata).length,
                changeType,
                dataKeys: Object.keys(metadata.data)
            });

            // Retry logic for file operations
            const retry = async (operation, description, maxAttempts = 3) => {
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    try {
                        logger.debug(`[iCloudService] - Attempting ${description} (attempt ${attempt}/${maxAttempts})`)
                        const result = await operation()
                        logger.debug(`[iCloudService] - Successfully completed ${description}`)
                        return result
                    } catch (error) {
                        if (attempt === maxAttempts) throw error
                        logger.warn(`[iCloudService] - Failed ${description} (attempt ${attempt}/${maxAttempts}):`, String(error))
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
                    }
                }
            }

            // Write and verify file with retries
            try {
                const content = new TextEncoder().encode(JSON.stringify(metadata, null, 2));

                // Write file and verify in a single atomic operation
                await retry(async () => {
            logger.info(`[iCloudService] Writing file:`, {
                path: itemPath,
                type,
                itemId,
                timestamp,
                size: content.length,
                fullPath: await join(this._container, type, `${itemId}.json`),
                container: this._container
            });

                    // Write the file
                    logger.info(`[iCloudService] Starting write to: ${itemPath}`);
                    await writeFile(itemPath, content);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    logger.info(`[iCloudService] Write completed, verifying...`);

                    // Verify file was written correctly
                    const verifyContent = await readFile(itemPath);
                    if (!verifyContent) {
                        throw new Error('File verification failed - file is empty');
                    }

                    // Parse and verify content matches
                    const verifyStr = new TextDecoder().decode(verifyContent);
                    const verifyMetadata = JSON.parse(verifyStr);
                    
                    if (!verifyMetadata || 
                        verifyMetadata.timestamp !== metadata.timestamp ||
                        verifyMetadata.clientId !== metadata.clientId) {
                        throw new Error('File verification failed - content mismatch');
                    }

                    return true;
                }, `write and verify file ${itemPath}`);

                // Double check file is accessible after a delay
                await new Promise(resolve => setTimeout(resolve, 500));
                const finalCheck = await readFile(itemPath);
                if (!finalCheck) {
                    throw new Error('Final verification failed - cannot access file');
                }

                logger.info(`[iCloudService] - Successfully wrote and verified file: ${itemPath}`);

            } catch (writeError) {
                logger.error(`[iCloudService] - Failed to write file after retries:`, {
                    path: itemPath,
                    error: String(writeError),
                    errorType: writeError.constructor.name,
                    stack: writeError.stack
                });
                throw new Error(`Failed to write file: ${writeError}`);
            }

            // Update sync metadata
            await this._updateSyncMetadata(type, {
                itemId,
                timestamp: metadata.timestamp,
                changeType,
                vectorClock: metadata.vectorClock
            });

            return true;
        } catch (error) {
            const errorStr = String(error || 'Unknown error');
            logger.error(`[iCloudService] Sync failed:`, {
                error: errorStr,
                context: {
                    type,
                    itemId,
                    dataType: typeof data,
                    hasData: !!data,
                    keys: data ? Object.keys(data) : []
                },
                stack: error?.stack
            });
            throw error; // Preserve original error
        }
    },

    async getItem(type, itemId) {
        await this._ensureInitialized()
        if (!this._isAvailable) {
            throw new Error('iCloud is not available')
        }

        const itemPath = await this.getItemPath(type, itemId)
        logger.debug(`[iCloudService] - Getting item:`, { type, itemId, path: itemPath })

        // Retry logic for file operations
        const retry = async (operation, description, maxAttempts = 3) => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    logger.debug(`[iCloudService] - Attempting ${description} (attempt ${attempt}/${maxAttempts})`)
                    const result = await operation()
                    logger.debug(`[iCloudService] - Successfully completed ${description}`)
                    return result
                } catch (error) {
                    const errorStr = String(error)
                    // Don't retry if file doesn't exist
                    if (errorStr.toLowerCase().includes('no such file') || 
                        errorStr.toLowerCase().includes('not found') || 
                        errorStr.toLowerCase().includes('enoent')) {
                        return null
                    }
                    if (attempt === maxAttempts) throw error
                    logger.warn(`[iCloudService] - Failed ${description} (attempt ${attempt}/${maxAttempts}):`, errorStr)
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
                }
            }
        }

        try {
            const metadata = await retry(async () => {
                const contents = await readFile(itemPath)
                if (!contents) {
                    throw new Error('Empty file')
                }
                const contents_str = new TextDecoder().decode(contents)
                const parsed = JSON.parse(contents_str)
                
                logger.debug(`[iCloudService] Read item:`, {
                    path: itemPath,
                    size: contents_str.length,
                    metadataKeys: Object.keys(parsed),
                    hasData: !!parsed.data,
                    timestamp: parsed.timestamp
                })
                
                return parsed
            }, `read item ${itemPath}`)

            if (!metadata) return null

            // Verify metadata structure
            if (!metadata.version || !metadata.clientId || !metadata.data) {
                logger.error(`[iCloudService] - Invalid metadata structure:`, metadata)
                throw new Error('Invalid metadata structure')
            }

            return metadata

        } catch (error) {
            const errorStr = String(error || 'Unknown error')
            logger.error(`[iCloudService] Error reading item:`, {
                type,
                itemId,
                path: itemPath,
                error: errorStr,
                stack: error.stack
            })
            throw new Error(`Failed to read item: ${errorStr}`)
        }
    },

    async getChangedItems(type, since = null) {
        await this._ensureInitialized()
        if (!this._isAvailable) {
            throw new Error('iCloud is not available')
        }

        const typePath = await join(this._container, type)
        const files = await readDir(typePath)
        const items = []

        for (const file of files) {
            if (!file.name.endsWith('.json')) continue

            try {
                const itemId = file.name.replace('.json', '')
                const metadata = await this.getItem(type, itemId)
                
                if (!metadata) continue

                // Only include if newer than last sync and has valid data
                if (!since || new Date(metadata.timestamp) > new Date(since)) {
                    items.push({
                        itemId,
                        data: metadata.data,
                        timestamp: metadata.timestamp,
                        changeType: metadata.changeType,
                        vectorClock: metadata.vectorClock
                    })
                }
            } catch (error) {
                logger.error(`[iCloudService] - Error reading item ${file.name}: ${error}`)
            }
        }

        return items
    },

    async syncPersona(personaId, data, changeType) {
        return this.syncItem('personas', personaId, data, changeType)
    },

    async getPersona(personaId) {
        return this.getItem('personas', personaId)
    },

    async getChangedPersonas(since = null) {
        return this.getChangedItems('personas', since)
    },

    async syncConversation(conversationId, data, changeType) {
        logger.debug('[iCloudService] Syncing conversation:', {
            conversationId,
            changeType,
            messageCount: data.messages?.length
        });

        // For conversations, ensure we're using the correct ID from the data
        const actualConversationId = data.history?.conversationId || 
                                   data.messages[0]?.conversationId || 
                                   conversationId;

        return this.syncItem('conversations', actualConversationId, data, changeType);
    },

    async getConversation(conversationId) {
        return this.getItem('conversations', conversationId)
    },

    async getChangedConversations(since = null) {
        return this.getChangedItems('conversations', since)
    },

    async syncImage(key, value) {
        await this._ensureInitialized();
        if (!this._isAvailable) {
            throw new Error('iCloud is not available');
        }

        // Validate image data
        if (!key || !value) {
            throw new Error(`Invalid image data: key=${key}, value=${!!value}`);
        }

        // Verify we have valid binary data
        if (!(value instanceof Blob || value instanceof ArrayBuffer)) {
            throw new Error(`Invalid image data type: ${value?.constructor?.name}`);
        }

        const imagesPath = await join(this._container, 'images')
        const imagePath = await join(imagesPath, key)

        logger.debug(`[iCloudService] Starting image sync:`, {
            key,
            path: imagePath,
            type: value.constructor.name,
            size: value.byteLength || value.size || 0,
            hasData: value.byteLength > 0 || value.size > 0
        });

        // Ensure we have valid binary data with content
        if (value.byteLength === 0 && value.size === 0) {
            throw new Error('Image data is empty');
        }

        // Retry logic for file operations (reusing pattern from syncItem)
        const retry = async (operation, description, maxAttempts = 3) => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    logger.debug(`[iCloudService] - Attempting ${description} (attempt ${attempt}/${maxAttempts})`)
                    const result = await operation()
                    logger.debug(`[iCloudService] - Successfully completed ${description}`)
                    return result
                } catch (error) {
                    if (attempt === maxAttempts) throw error
                    logger.warn(`[iCloudService] - Failed ${description} (attempt ${attempt}/${maxAttempts}):`, {
                        error: String(error),
                        type: error?.constructor?.name,
                        stack: error?.stack
                    })
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
                }
            }
        }

        try {
            // Ensure directory exists first
            await mkdir(imagesPath, { recursive: true })

            // Write and verify file with retries
            await retry(async () => {
                // Write the file
                await writeFile(imagePath, value)
                await new Promise(resolve => setTimeout(resolve, 100))

                // Verify file was written correctly
                const verifyContent = await readFile(imagePath)
                if (!verifyContent || verifyContent.byteLength !== value.byteLength) {
                    throw new Error('Image verification failed - size mismatch or file empty')
                }

                return true
            }, `write and verify image ${key}`)

            // Double check file is accessible after a delay
            await new Promise(resolve => setTimeout(resolve, 500))
            const finalCheck = await readFile(imagePath)
            if (!finalCheck) {
                throw new Error('Final verification failed - cannot access image file')
            }

            logger.info(`[iCloudService] - Successfully synced image to cloud: ${key}`)
            return true
        } catch (error) {
            logger.error(`[iCloudService] - Failed to sync image:`, {
                key,
                path: imagePath,
                error: String(error),
                stack: error.stack
            })
            throw new Error(`Failed to sync image ${key}: ${error.message}`)
        }
    },

    async importCloudImages(since = null) {
        try {
            const imagesPath = await join(this._container, 'images')
            const cloudImages = await readDir(imagesPath)
            const importedImages = []

            // Import missing images from cloud
            for (const file of cloudImages) {
                try {
                    if (!await imageDB.getItem(file.name)) {
                        const imagePath = await join(imagesPath, file.name)
                        const imageBlob = await readFile(imagePath)
                        await imageDB.setItem(file.name, imageBlob)
                        logger.info(`[iCloudService] - Imported image from cloud: ${file.name}`)
                        importedImages.push({
                            itemId: file.name,
                            data: imageBlob,
                            timestamp: new Date().toISOString()
                        })
                    }
                } catch (error) {
                    logger.error(`[iCloudService] - Error importing image ${file.name}: ${error}`)
                }
            }

            return importedImages
        } catch (error) {
            logger.error(`[iCloudService] - Error importing cloud images: ${error}`)
            return []
        }
    },

    async cleanupOrphanedImages() {
        try {
            const imagesPath = await join(this._container, 'images')
            const cloudImages = await readDir(imagesPath)
            
            // Get all image references from conversations
            const changedConvs = await this.getChangedItems('conversations')
            const imageRefs = new Set()
            changedConvs.forEach(({ data }) => {
                // Check messages array in both history and messages fields
                if (data.history?.messages) {
                    data.history.messages.forEach(message => {
                        if (message.choices) {
                            message.choices.forEach(choice => {
                                if (choice.content?.startsWith('image-')) {
                                    imageRefs.add(choice.content)
                                }
                            })
                        }
                    })
                }
                if (data.messages) {
                    data.messages.forEach(message => {
                        if (message.choices) {
                            message.choices.forEach(choice => {
                                if (choice.content?.startsWith('image-')) {
                                    imageRefs.add(choice.content)
                                }
                            })
                        }
                    })
                }
            })

            // Remove any images that aren't referenced in conversations
            for (const file of cloudImages) {
                if (!imageRefs.has(file.name)) {
                    try {
                        const imagePath = await join(imagesPath, file.name)
                        await remove(imagePath)
                        logger.info(`[iCloudService] - Deleted orphaned image: ${file.name}`)
                    } catch (error) {
                        logger.error(`[iCloudService] - Error deleting orphaned image ${file.name}: ${error}`)
                    }
                }
            }
        } catch (error) {
            logger.error(`[iCloudService] - Error cleaning up orphaned images: ${error}`)
        }
    }
}

iCloudService.init()

export default iCloudService
