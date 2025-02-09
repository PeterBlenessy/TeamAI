import { join, dirname } from '@tauri-apps/api/path';
import { platform, homeDir } from '@tauri-apps/api/os';
import { readDir, readFile, writeFile, mkdir } from '@tauri-apps/plugin-fs';
import logger from '@/services/logger';
import { createProvider } from '../create-provider';
import { baseOperations } from '../base-operations';
import { CloudError, FileMetadata, Change } from '../types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class ICloudProvider {
    VERSION = '1.0';
    _container = null;
    _initialized = false;
    _isAvailable = false;

    async init() {
        try {
            const platformName = await platform();
            logger.info('[ICloudProvider] Initializing with platform:', platformName);
            
            if (platformName === 'macos') {
                const home = await homeDir();
                const iCloudPath = await join(home, 'Library', 'Mobile Documents');
                const iCloudDocsPath = await join(iCloudPath, 'com~apple~CloudDocs');
                this._container = await join(iCloudDocsPath, 'TeamAI');
                
                await this._setupContainer();
                this._isAvailable = true;
                this._initialized = true;
            } else {
                logger.warn('[ICloudProvider] iCloud is only supported on macOS');
                this._isAvailable = false;
            }
        } catch (error) {
            logger.error('[ICloudProvider] Initialization failed:', {
                error: String(error),
                stack: error.stack
            });
            this._isAvailable = false;
            throw new CloudError('Failed to initialize iCloud provider', { cause: error });
        }
    }

    async _setupContainer() {
        try {
            logger.info('[ICloudProvider] Setting up container at:', this._container);
            
            // Create and validate main container
            await mkdir(this._container, { recursive: true });
            
            // Create standard subdirectories
            const dirs = ['personas', 'conversations', 'images'];
            for (const dir of dirs) {
                const path = await join(this._container, dir);
                await mkdir(path, { recursive: true });
            }
            
            logger.info('[ICloudProvider] Container setup complete');
        } catch (error) {
            logger.error('[ICloudProvider] Container setup failed:', {
                error: String(error),
                container: this._container
            });
            throw new CloudError('Failed to setup iCloud container', { cause: error });
        }
    }

    async readFile(path) {
        try {
            const content = await readFile(path);
            if (!content) {
                throw new CloudError('Empty file', { path });
            }
            return content;
        } catch (error) {
            throw new CloudError(`Failed to read file: ${path}`, { cause: error });
        }
    }

    async writeFile(path, data) {
        try {
            await writeFile(path, data);
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for sync
            
            // Verify write
            const content = await this.readFile(path);
            if (!content || content.byteLength !== (data instanceof Blob ? data.size : data.byteLength)) {
                throw new Error('File verification failed');
            }
        } catch (error) {
            throw new CloudError(`Failed to write file: ${path}`, { cause: error });
        }
    }

    async deleteFile(path) {
        try {
            await remove(path);
        } catch (error) {
            throw new CloudError(`Failed to delete file: ${path}`, { cause: error });
        }
    }

    async listFiles(dirPath) {
        try {
            return await readDir(dirPath);
        } catch (error) {
            if (error.toString().includes('No such file')) {
                return [];
            }
            throw new CloudError(`Failed to list files in: ${dirPath}`, { cause: error });
        }
    }

    async createDir(path) {
        try {
            await mkdir(path, { recursive: true });
        } catch (error) {
            throw new CloudError(`Failed to create directory: ${path}`, { cause: error });
        }
    }

    async listChanges(since = null) {
        const changes = [];
        const dirs = ['personas', 'conversations', 'images'];

        try {
            for (const dir of dirs) {
                const dirPath = await join(this._container, dir);
                const files = await this.listFiles(dirPath);
                
                for (const file of files) {
                    const metadata = await this.getMetadata(file.path);
                    
                    if (!since || metadata.modified > new Date(since)) {
                        changes.push({
                            path: file.path,
                            type: 'modified',
                            timestamp: metadata.modified
                        });
                    }
                }
            }
            
            return changes;
        } catch (error) {
            throw new CloudError('Failed to list changes', { cause: error });
        }
    }

    isAvailable() {
        return this._isAvailable; // Return the boolean directly instead of a Promise
    }

    async getMetadata(path) {
        try {
            const stats = await readDir(dirname(path));
            const file = stats.find(f => f.path === path);
            
            if (!file) {
                throw new Error('File not found');
            }

            return {
                modified: new Date(file.modifiedAt),
                size: file.size,
                type: file.isDirectory ? 'directory' : 'file',
                name: file.name,
                path: file.path
            };
        } catch (error) {
            throw new CloudError(`Failed to get metadata for: ${path}`, { cause: error });
        }
    }
}

// Create provider with base operations and error handling
export function createICloudProvider() {
    const implementation = new ICloudProvider();
    
    return createProvider(implementation, {
        retryAttempts: 3,
        retryDelay: 1000
    });
}

// Export singleton instance
const iCloudProvider = createICloudProvider();
export default iCloudProvider;