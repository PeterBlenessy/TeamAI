/**
 * Common error types
 */
export class CloudError extends Error {
    details?: Record<string, any>;
    constructor(message: string, details?: Record<string, any>) {
        super(message);
        this.name = 'CloudError';
        this.details = details;
    }
}

export class ValidationError extends CloudError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, details);
        this.name = 'ValidationError';
    }
}

/**
 * Storage provider interface
 */
export interface StorageProvider {
    init(): Promise<void>;
    readFile(path: string): Promise<Blob | ArrayBuffer>;
    writeFile(path: string, data: Blob | ArrayBuffer): Promise<void>;
    deleteFile(path: string): Promise<void>;
    listFiles(dirPath: string): Promise<string[]>;
    createDir(path: string): Promise<void>;
    listChanges(since?: Date): Promise<Change[]>;
    isAvailable(): boolean;
    getMetadata(path: string): Promise<FileMetadata>;
    validateConnection(): Promise<void>;
    ensureInitialized(): Promise<void>;
}

/**
 * File metadata
 */
export interface FileMetadata {
    modified: Date;
    size: number;
    type: 'file' | 'directory';
    name?: string;
    path?: string;
}

/**
 * Change record
 */
export interface Change {
    path: string;
    type: 'added' | 'modified' | 'deleted';
    timestamp: Date;
    vectorClock?: VectorClock;
}

export interface VectorClock {
    timestamp: string;
    client: string;
    counter: number;
}

/**
 * Sync progress
 */
export interface SyncProgress {
    phase: SyncPhase;
    phaseProgress: number;
    totalProgress: number;
    currentItem?: {
        type: string;
        count: number;
        total: number;
    };
}

export enum SyncPhase {
    IDLE = 'idle',
    CHECK = 'check',
    UPLOAD = 'upload',
    DOWNLOAD = 'download'
}

export interface SyncOptions {
    retryAttempts?: number;
    retryDelay?: number;
    batchSize?: number;
    validateData?: boolean;
}

/**
 * Handler interface
 */
export interface SyncHandler<T = any> {
    type: string;
    enabled(): boolean;
    transform(data: T): Promise<any>;
    validate(data: T): Promise<boolean>;
    getPendingUploads(): Promise<PendingUpload[]>;
    compareItems(local: T, remote: T): boolean;
    sync(id: string, data: T, changeType: ChangeType): Promise<void>;
    getChanges(since?: string): Promise<Change[]>;
    applyChange(change: Change): Promise<void>;
}

export interface PendingUpload {
    id: string;
    data: any;
    changeType: ChangeType;
    timestamp?: string;
}

export enum ChangeType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete'
}

/**
 * Core sync interface
 */
export interface SyncCore {
    progress: SyncProgress;
    errors: Error[];
    registerHandler(type: string, handler: SyncHandler): void;
    sync(): Promise<void>;
}