import { join, dirname } from '@tauri-apps/api/path';
import { platform, homeDir } from '@tauri-apps/api/os';
import { readDir, readFile, writeFile, mkdir, remove } from '@tauri-apps/plugin-fs';
import logger from '@/services/logger';
import { createProvider } from '../create-provider';
import { CloudError } from '../types';

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
            await mkdir(this._container, { recursive: true });
            
            const dirs = ['personas', 'conversations', 'images'];
            for (const dir of dirs) {
                const path = await join(this._container, dir);
                await mkdir(path, { recursive: true });
            }
            
            logger.info('[ICloudProvider] Container setup complete');
        } catch (error) {
            logger.error('[ICloudProvider] Container setup failed:', {
                container: this._container,
                error: String(error)
            });
            throw new CloudError('Failed to setup iCloud container', { cause: error });
        }
    }

    async readFile(path) {
        return await readFile(path);
    }

    async writeFile(path, data) {
        await writeFile(path, data);
    }

    async deleteFile(path) {
        await remove(path);
    }

    async listFiles(dirPath) {
        try {
            return await readDir(dirPath);
        } catch (error) {
            if (error.toString().includes('No such file')) {
                return [];
            }
            throw error;
        }
    }

    async createDir(path) {
        await mkdir(path, { recursive: true });
    }

    async listChanges(since = null) {
        const changes = [];
        const dirs = ['personas', 'conversations', 'images'];

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
    }

    isAvailable() {
        return this._isAvailable;
    }

    async getMetadata(path) {
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
    }
}

// Create provider with base operations
export function createICloudProvider() {
    return createProvider(new ICloudProvider());
}

// Export singleton instance
const iCloudProvider = createICloudProvider();
export default iCloudProvider;