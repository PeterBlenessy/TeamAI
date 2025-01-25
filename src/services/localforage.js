import localforage from 'localforage';
import logger from '@/services/logger.js';

const dbName = 'TeamAI';

const defaultLocalForageConfiguration = {
    driver: localforage.INDEXEDDB,
    name: dbName,
};

// Only create settingsDB if settings haven't been migrated to localStorage yet
let settingsDB;
if (localStorage.getItem('dBVersion') === null) {
    settingsDB = localforage.createInstance({
        ...defaultLocalForageConfiguration,
        storeName: 'settings',
        description: 'Application settings'
    });
}

// Create localForage instance for storing teams, their members, and their messages
const teamsDB = localforage.createInstance({
    ...defaultLocalForageConfiguration,
    storeName: 'teams',
    description: 'Teams, their members, and their messages'
});

const imageDB = localforage.createInstance({
    ...defaultLocalForageConfiguration,
    storeName: 'images',
    description: 'Images generated using OpenAI or uploaded as avatars'
});

// LocalForage plugin for pinia stores
const localForagePlugin = (({ store }) => {
    // Make sure we use the right localForage instance for this store.
    // Existing instance will be reused.
    const storage = localforage.createInstance({
        ...defaultLocalForageConfiguration,
        storeName: store.$id
    });

    // These are the state variables currently in the Pinia store
    // We will remove the ones that are not in the store from indexedDB
    const storeKeys = Object.keys(store.$state);

    // Load the persisted state from storage.
    // Called at application start, when the plugin is registered for the store.
    let persistedState = {};
    storage.iterate((value, key, iterationNumber) => {
        try {
            const parsedValue = JSON.parse(value);
            if (typeof parsedValue === 'undefined') {
                logger.error(`[localforage] - Parsed value is undefined for key ${key} in store ${store.$id}`);
                storage.removeItem(key);
                return;
            }
            persistedState[key] = parsedValue;
            // Remove keys with empty values, so default values can be used instead
            if (persistedState[key] == null || persistedState[key].length == 0) {
                delete persistedState[key];
                storage.removeItem(key);
            }
        } catch (error) {
            logger.error(`[localforage] - Error parsing value for key ${key} in store ${store.$id}: ${error}`);
            storage.removeItem(key); // Remove invalid data
        }

        // Keep indexedDB clean from old and now unused persisted state keys.
        if (!storeKeys.includes(key)) {
            storage.removeItem(key);
        }
    }).then(() => {
        // Restore the persisted state
        if (Object.keys(persistedState).length != 0) store.$patch(persistedState);
    }).catch((error) => {
        logger.error(`[localforage] - Error loading the persisted state: ${JSON.stringify(error)}`);
    }).finally(() => {
        logger.info(`[localforage] - Persisted states restored from storage:  ${store.$id}`);
    });

    // Subscribe to store changes and save them to the persistent storage.
    // Skip persisting changes for the settings store since it uses localStorage
    if (store.$id !== 'settings') {
        store.$subscribe((mutation, state) => {
            // Persist each state element separately
            for (const element in state) {
                try {
                    const serializedValue = JSON.stringify(state[element]);
                    if (typeof serializedValue === 'undefined') {
                        logger.error(`[localforage] - Cannot serialize undefined value for key ${element} in store ${store.$id}`);
                        continue;
                    }
                    storage.setItem(element, serializedValue);
                } catch (error) {
                    logger.error(`[localforage] - Error serializing value for key ${element} in store ${store.$id}: ${error}`);
                }
            }
        });
    }
});

export {
    imageDB,
    settingsDB,
    teamsDB,
    localForagePlugin
};
