/**
 * Creates a base sync handler with default implementations
 * @param {Object} implementation - Handler specific implementations
 * @returns {Object} Handler with default and custom implementations merged
 */
export const createBaseHandler = (implementation = {}) => ({
    // Whether this sync handler is enabled
    enabled: () => true,
    
    // Sync an item to the cloud
    sync: () => Promise.resolve(),
    
    // Get changed items from the cloud
    getChanges: () => Promise.resolve([]),
    
    // Apply a change from the cloud locally
    applyChange: () => {},
    
    // Merge with custom implementation
    ...implementation
});
