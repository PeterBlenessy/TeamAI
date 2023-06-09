import localforage from 'localforage';

const dbName = 'TeamAI';

// Configure locaForage
localforage.config({
    driver: localforage.INDEXEDDB,
    name: dbName
});

// Initialize localForage instance
const settingsDB = localforage.createInstance({
    storeName: 'settings',
    description: 'Application settings'
});

export { 
    settingsDB 
};