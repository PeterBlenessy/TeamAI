import { join } from '@tauri-apps/api/path';
import logger from '@/services/logger';

/**
 * Join path segments in a platform-agnostic way
 */
export async function joinPaths(...segments) {
    try {
        // For tests, fall back to simple path joining
        if (typeof window === 'undefined') {
            return segments.join('/');
        }
        return join(...segments);
    } catch (error) {
        logger.error('[PathUtil] Failed to join paths:', {
            segments,
            error: String(error)
        });
        // Fallback to simple join
        return segments.join('/');
    }
}