import localforage from 'localforage';
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
    driver: localforage.INDEXEDDB,
    name: dbName,
    storeName: 'teams',
    description: 'Teams, their members, and their messages'
});

// LocalForage plugin for pinia stores
const localForagePlugin = (({ store }) => {

    // Make sure we use the right localForage instance for this store.
    // Existing instance will be reused.
    const storage = localforage.createInstance({
        ...defaultLocalForageConfiguration,
        storeName: store.$id
    });

    // Load the persisted state from storage.
    // Called at application start, when the plugin is registered for the store.
    let persistedState = {};
    storage.iterate((value, key, iterationNumber) => {
        persistedState[key] = JSON.parse(value);
        // Remove keys with empty values, so default values can be used instead
        if ( persistedState[key] == null || persistedState[key].length == 0 ) {
            delete persistedState[key];
        }
    }).then(() => {
        // Restore the persisted state
        if (Object.keys(persistedState).length != 0) store.$patch(persistedState);
    }).catch((error) => {
        console.log(error);
    }).finally(() => {
        console.log("Persisted states restored from storage: ", store.$id);
    });

    // Subscribe to store changes and save them to the persistent storage.
    store.$subscribe((mutation, state) => {
        // Persist each state element separately
        for (const element in state) {
            storage.setItem(element, JSON.stringify(state[element]));
        }
    })
})

export {
    settingsDB,
    teamsDB,
    localForagePlugin
};