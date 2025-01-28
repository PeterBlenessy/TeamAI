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
    CONVERSATIONS: 'conversations'
}

class SyncStateManager {
    constructor() {
        this._vectorClock = {}
        this._clientId = null
        this._changes = new Map()
        this.syncState = SyncState.IDLE
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

    // Track changes
    trackChange(type, itemId, change) {
        const key = `${type}:${itemId}`
        this._changes.set(key, {
            ...change,
            timestamp: Date.now(),
            vectorClock: this.incrementVectorClock()
        })
        logger.info(`[SyncManager] Tracked change for ${key}`)
    }

    // Get changes for type
    getChanges(type) {
        const changes = {}
        for (const [key, value] of this._changes.entries()) {
            if (key.startsWith(`${type}:`)) {
                const itemId = key.split(':')[1]
                changes[itemId] = value
            }
        }
        return changes
    }

    // Clear tracked changes for type
    clearChanges(type) {
        for (const key of this._changes.keys()) {
            if (key.startsWith(`${type}:`)) {
                this._changes.delete(key)
            }
        }
    }

    // Utility functions
    _getClientId() {
        const storedId = window?.localStorage?.getItem('sync_client_id')
        if (storedId) return storedId

        const newId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        window?.localStorage?.setItem('sync_client_id', newId)
        return newId
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
