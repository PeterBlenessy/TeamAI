/**
 * Cloud sync states
 */
export const SyncState = {
    IDLE: 'idle',
    SYNCING: 'syncing',
    COMPLETED: 'completed',
    ERROR: 'error'
};

/**
 * Cloud sync phases
 */
export const SyncPhase = {
    IDLE: 'idle',
    STARTING: 'starting',
    CHECKING: 'checking',
    UPLOADING: 'uploading',
    CLEANING: 'cleaning',
    COMPLETED: 'completed',
    ERROR: 'error'
};

/**
 * Supported data types
 */
export const SyncType = {
    PERSONAS: 'personas',
    CONVERSATIONS: 'conversations',
    IMAGES: 'images'
};