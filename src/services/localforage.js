import localforage from 'localforage';

const dbName = 'TeamAI';

// Initialize localForage instance
const settingsDB = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: dbName,
    storeName: 'settings',
    description: 'Application settings'
});

export { 
    settingsDB
};