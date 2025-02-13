import { join, dirname, homeDir } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';
import { readDir, readFile, writeFile, mkdir, remove } from '@tauri-apps/plugin-fs';
import logger from '@/services/logger';
import { CloudStorageError } from '../cloudSyncService';

/**
 * Creates an iCloud Drive provider instance
 */
function createICloudProvider() {
    // Private state
    let container = null;
    let initialized = false;
    let isAvailable = false;
    let platformName = null;

    // Private functions
    async function setupContainer() {
        try {
            logger.info('[ICloudDrive] Setting up container at:', container);
            
            // Create base container directory
            await mkdir(container, { recursive: true });
            
            // Create subdirectories one by one to ensure proper path handling
            for (const dir of ['personas', 'conversations', 'images']) {
                const dirPath = await join(container, dir);
                logger.debug('[ICloudDrive] Creating directory:', dirPath);
                await mkdir(dirPath, { recursive: true });
            }
            
            logger.info('[ICloudDrive] Container setup complete');
        } catch (error) {
            logger.error('[ICloudDrive] Container setup failed:', {
                container,
                error: String(error)
            });
            throw new CloudStorageError('Failed to setup iCloud container', { cause: error });
        }
    }

    async function ensureInitialized() {
        if (!initialized) {
            throw new CloudStorageError('Provider not initialized - call init() first');
        }
        if (!isAvailable) {
            if (platformName !== 'macos') {
                throw new CloudStorageError('iCloud Drive is only available on macOS');
            }
            throw new CloudStorageError('iCloud Drive is not available - check iCloud settings');
        }
    }

    // Public interface
    return {
        async init() {
            try {
                platformName = await platform();
                logger.info('[ICloudDrive] Initializing with platform:', platformName);
                
                if (platformName === 'macos') {
                    const home = await homeDir();
                    const iCloudPath = await join(home, 'Library', 'Mobile Documents');
                    const iCloudDocsPath = await join(iCloudPath, 'com~apple~CloudDocs');
                    container = await join(iCloudDocsPath, 'TeamAI');
                    
                    logger.debug('[ICloudDrive] Container path:', container);
                    
                    await setupContainer();
                    isAvailable = true;
                    initialized = true;
                } else {
                    logger.warn('[ICloudDrive] iCloud is only available on macOS');
                    isAvailable = false;
                }
            } catch (error) {
                logger.error('[ICloudDrive] Initialization failed:', {
                    error: String(error),
                    stack: error.stack,
                    container,
                    platform: platformName
                });
                isAvailable = false;
                throw new CloudStorageError('Failed to initialize iCloud provider', { cause: error });
            }
        },

        async readFile(path) {
            await ensureInitialized();
            try {
                if (!path) {
                    throw new Error('Path is required for readFile');
                }
                const content = await readFile(path);
                
                // Only decode JSON files, leave binary data as is
                if (content instanceof ArrayBuffer || content instanceof Uint8Array) {
                    if (path.endsWith('.json')) {
                        const decoded = new TextDecoder().decode(content);
                        logger.debug('[ICloudDrive] Read JSON content:', {
                            path,
                            contentSize: content.byteLength
                        });
                        return decoded;
                    }
                    // Return binary data as is
                    return content;
                }
                
                return content;
            } catch (error) {
                logger.error('[ICloudDrive] Error reading file:', {
                    path,
                    error: String(error)
                });
                throw error;
            }
        },

        async writeFile(path, data) {
            await ensureInitialized();
            try {
                if (!path) {
                    throw new Error('Path is required for writeFile');
                }
                
                // Handle different input types
                let content;
                if (typeof data === 'string') {
                    // String data (JSON) gets encoded as UTF-8
                    content = new TextEncoder().encode(data);
                } else if (data instanceof Blob) {
                    // Convert Blob to ArrayBuffer
                    content = await data.arrayBuffer();
                } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
                    // Binary data used as is
                    content = data;
                } else {
                    throw new Error('Invalid data type for file write');
                }
                
                await writeFile(path, content);
                logger.debug('[ICloudDrive] Wrote file:', {
                    path,
                    size: content.byteLength,
                    type: typeof data === 'string' ? 'json' : 'binary'
                });
            } catch (error) {
                logger.error('[ICloudDrive] Error writing file:', {
                    path,
                    error: String(error)
                });
                throw error;
            }
        },

        async listFiles(dirPath) {
            await ensureInitialized();
            try {
                if (!dirPath) {
                    throw new Error('Path is required for listFiles');
                }
                
                const files = await readDir(dirPath);
                const items = [];
                
                // Process each file entry to ensure consistent path information
                for (const file of (files || [])) {
                    try {
                        const fullPath = await join(dirPath, file.name);
                        items.push({
                            name: file.name,
                            path: fullPath,
                            size: file.size,
                            modifiedAt: file.modifiedAt,
                            isDirectory: file.children !== undefined
                        });
                    } catch (err) {
                        logger.warn('[ICloudDrive] Error processing file entry:', {
                            fileName: file.name,
                            error: String(err)
                        });
                    }
                }
                
                logger.debug('[ICloudDrive] Listed directory:', {
                    path: dirPath,
                    fileCount: items.length
                });
                
                return items;
            } catch (error) {
                if (error.toString().includes('No such file')) {
                    return [];
                }
                logger.error('[ICloudDrive] Error listing directory:', {
                    path: dirPath,
                    error: String(error)
                });
                throw error;
            }
        },

        async deleteFile(path) {
            await ensureInitialized();
            try {
                if (!path) {
                    throw new Error('Path is required for deleteFile');
                }
                await remove(path);
                logger.debug('[ICloudDrive] Deleted file:', { path });
            } catch (error) {
                logger.error('[ICloudDrive] Error deleting file:', {
                    path,
                    error: String(error)
                });
                throw error;
            }
        },

        async createDir(path) {
            await ensureInitialized();
            try {
                if (!path) {
                    throw new Error('Path is required for createDir');
                }
                await mkdir(path, { recursive: true });
                logger.debug('[ICloudDrive] Created directory:', { path });
            } catch (error) {
                logger.error('[ICloudDrive] Error creating directory:', {
                    path,
                    error: String(error)
                });
                throw error;
            }
        },

        isAvailable() {
            if (!initialized) {
                logger.debug('[ICloudDrive] Provider not initialized');
                return false;
            }
            if (platformName !== 'macos') {
                logger.debug('[ICloudDrive] Not on macOS');
                return false;
            }
            return isAvailable;
        },

        getContainerPath() {
            if (!container) {
                throw new CloudStorageError('Container path not initialized');
            }
            return container;
        }
    };
}

// Export singleton instance
export default createICloudProvider();