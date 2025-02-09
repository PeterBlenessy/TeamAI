import { dirname } from '@tauri-apps/api/path';
import logger from '@/services/logger';

/**
 * Common file operations shared across providers
 */
export const baseOperations = {
    /**
     * Ensures a directory exists, creates if missing
     */
    async ensureDir(path) {
        try {
            const exists = await this.listFiles(path).catch(() => false);
            if (!exists) {
                await this.createDir(path);
                logger.debug('[CloudStorage] Created directory:', path);
            }
        } catch (error) {
            logger.error('[CloudStorage] Failed to ensure directory exists:', {
                path,
                error: String(error)
            });
            throw error;
        }
    },

    /**
     * Safely writes a file, ensuring parent directory exists
     */
    async safeWrite(path, data) {
        try {
            const dir = await dirname(path);
            await this.ensureDir(dir);
            await this.writeFile(path, data);
            
            logger.debug('[CloudStorage] Successfully wrote file:', {
                path,
                size: data instanceof Blob ? data.size : data?.length
            });
        } catch (error) {
            logger.error('[CloudStorage] Failed to write file:', {
                path,
                error: String(error)
            });
            throw error;
        }
    },

    /**
     * Retries an operation with exponential backoff
     */
    async retry(operation, description, maxAttempts = 3) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                logger.debug(`[CloudStorage] Attempting ${description} (${attempt}/${maxAttempts})`);
                const result = await operation();
                logger.debug(`[CloudStorage] Successfully completed ${description}`);
                return result;
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                logger.warn(`[CloudStorage] Failed ${description} (attempt ${attempt}/${maxAttempts}):`, 
                    String(error)
                );
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
};