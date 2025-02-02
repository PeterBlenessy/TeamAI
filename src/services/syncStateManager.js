import logger from './logger'

// Sync states
export const SyncState = {
    IDLE: 'idle',
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    OFFLINE: 'offline'
}

// Sync item types
export const SyncType = {
    PERSONAS: 'personas',
    CONVERSATIONS: 'conversations',
    IMAGES: 'images'
}

// Change types
export const ChangeType = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete'
}

class SyncStateManager {
    constructor() {
        this._vectorClock = {}
        this._clientId = null
        this._itemVersions = new Map() // Track versions per item
        this._changes = new Map() // Track changes per item
        this.syncState = SyncState.IDLE
    }

    clearCompleted() {
        if (this.syncState === SyncState.COMPLETED || this.syncState === SyncState.FAILED) {
            this._changes.clear()
            this.syncState = SyncState.IDLE
        }
    }

    init() {
        this._clientId = this._getClientId()
        return this
    }

    // Vector clock operations
    incrementVectorClock() {
        this._vectorClock[this._clientId] = (this._vectorClock[this._clientId] || 0) + 1
        return { ...this._vectorClock }
    }

    compareVectorClocks(clock1, clock2) {
        const allClients = new Set([
            ...Object.keys(clock1),
            ...Object.keys(clock2)
        ])

        let greater = false
        let lesser = false

        for (const client of allClients) {
            const time1 = clock1[client] || 0
            const time2 = clock2[client] || 0

            if (time1 > time2) greater = true
            if (time1 < time2) lesser = true
        }

        if (greater && lesser) return 'concurrent'
        if (greater) return 'greater'
        if (lesser) return 'lesser'
        return 'equal'
    }

    // Track changes for individual items
    trackChange(type, itemId, change, changeType = ChangeType.UPDATE) {
        if (!type || !itemId || !change) {
            logger.error(`[SyncManager] Invalid parameters for trackChange: type=${type}, itemId=${itemId}`)
            this.syncState = SyncState.FAILED
            throw new Error('Invalid parameters for tracking change')
        }

        try {
            const key = `${type}:${itemId}`
            const currentVersion = this._itemVersions.get(key) || 0
            const newVersion = currentVersion + 1

            this._changes.set(key, {
                ...change,
                changeType,
                version: newVersion,
                timestamp: Date.now(),
                vectorClock: this.incrementVectorClock()
            })

            this._itemVersions.set(key, newVersion)
            this.syncState = SyncState.PENDING
            logger.info(`[SyncManager] Tracked ${changeType} for ${key} (v${newVersion})`)
        } catch (error) {
            logger.error(`[SyncManager] Error tracking change: ${error}`)
            this.syncState = SyncState.FAILED
            throw error
        }
    }

    // Get specific item change
    getItemChange(type, itemId) {
        const key = `${type}:${itemId}`
        return this._changes.get(key)
    }

    // Get all pending changes for type
    getChanges(type) {
        const changes = new Map()
        for (const [key, value] of this._changes.entries()) {
            if (key.startsWith(`${type}:`)) {
                const itemId = key.split(':')[1]
                changes.set(itemId, value)
            }
        }
        return changes
    }

    // Get list of changed item IDs for type
    getChangedItems(type) {
        const items = []
        for (const [key] of this._changes.entries()) {
            if (key.startsWith(`${type}:`)) {
                items.push(key.split(':')[1])
            }
        }
        return items
    }

    // Clear tracked changes for specific item
    clearItemChanges(type, itemId) {
        const key = `${type}:${itemId}`
        this._changes.delete(key)
    }

    // Clear all tracked changes for type
    clearChanges(type) {
        const keysToDelete = []
        for (const key of this._changes.keys()) {
            if (key.startsWith(`${type}:`)) {
                keysToDelete.push(key)
            }
        }
        keysToDelete.forEach(key => this._changes.delete(key))
    }

    // Utility functions
    _getClientId() {
        const storedId = window?.localStorage?.getItem('sync_client_id')
        if (storedId) return storedId

        const newId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        window?.localStorage?.setItem('sync_client_id', newId)
        return newId
    }

    hasLocalChanges() {
        return this._changes.size > 0
    }

    hasChanges(type) {
        for (const key of this._changes.keys()) {
            if (key.startsWith(`${type}:`)) {
                return true
            }
        }
        return false
    }

    getVectorClock() {
        return { ...this._vectorClock }
    }

    getClientId() {
        return this._clientId
    }
}

// Export singleton instance
export const syncStateManager = new SyncStateManager().init()
