import localforage from 'localforage';
import logger from '@/services/logger.js';

const dbName = 'TeamAI';

const defaultLocalForageConfiguration = {
    driver: localforage.INDEXEDDB,
    name: dbName,
};

// Create localForage instance for storing application settings
const settingsDB = localforage.createInstance({
    ...defaultLocalForageConfiguration,
    storeName: 'settings',
    description: 'Application settings'
});

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
        persistedState[key] = JSON.parse(value);
        // Remove keys with empty values, so default values can be used instead
        if (persistedState[key] == null || persistedState[key].length == 0) {
            delete persistedState[key];
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
    store.$subscribe((mutation, state) => {
        // Persist each state element separately
        for (const element in state) {
            storage.setItem(element, JSON.stringify(state[element]));
        }
    });
})

export {
    imageDB,
    settingsDB,
    teamsDB,
    localForagePlugin
};