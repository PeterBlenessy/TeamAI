import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import storage from '@/services/localStorage.js';

// Load initial state from localStorage
const loadFromStorage = (key, defaultValue) => {
    const value = storage.getItem(key);
    return value !== null ? value : defaultValue;
};

export const useSettingsStore = defineStore('settings', () => {
    // Add downloading models state
    const downloadingModels = ref([]);

    const store = {
        // Application settings
        appMode: ref(loadFromStorage('appMode', 'basic')),
        darkMode: ref(loadFromStorage('darkMode', 'auto')),
        userAvatar: ref(loadFromStorage('userAvatar', '')),
        userLocale: ref(loadFromStorage('userLocale', 'en')),
        speechLanguage: ref(loadFromStorage('speechLanguage', 'en')),
        conversationMode: ref(loadFromStorage('conversationMode', true)),
        chatDirection: ref(loadFromStorage('chatDirection', 'up')),
        quickSettings: ref(loadFromStorage('quickSettings', true)),
        streamResponse: ref(loadFromStorage('streamResponse', true)),

        // Logging settings
        loggingEnabled: ref(loadFromStorage('loggingEnabled', true)),
        logLevel: ref(loadFromStorage('logLevel', 'info')),

        // API settings
        apiProviders: ref(loadFromStorage('apiProviders', [])),
        defaultProvider: ref(loadFromStorage('defaultProvider', 'Ollama')),

        // Chat completion settings
        model: ref(loadFromStorage('model', 'gpt-4o')),
        maxTokens: ref(loadFromStorage('maxTokens', 4096)),
        temperature: ref(loadFromStorage('temperature', 0.2)),

        // Image settings
        choices: ref(loadFromStorage('choices', 1)),
        imageSize: ref(loadFromStorage('imageSize', '1024x1024')),
        imageQuality: ref(loadFromStorage('imageQuality', 'standard')),
        imageStyle: ref(loadFromStorage('imageStyle', 'vivid')),

        // Persona settings
        personas: ref(loadFromStorage('personas', [])),

        dBVersion: ref(loadFromStorage('dBVersion', 0)),
        isDBUpgraded: ref(loadFromStorage('isDBUpgraded', false)),

        lastSync: ref(loadFromStorage('lastSync', null)),

        // Cloud sync settings
        cloudSync: ref(loadFromStorage('cloudSync', false)),
        cloudProvider: ref(loadFromStorage('cloudProvider', 'iCloud')),
        syncOptions: ref(loadFromStorage('syncOptions', {
            settings: true,
            personas: true,
            conversations: false
        })),

        downloadingModels,
    };

    // Set up watchers for each ref to persist changes to localStorage
    for (const [key, value] of Object.entries(store)) {
        if (key !== 'downloadingModels') {
            watch(value, (newValue) => {
                storage.setItem(key, newValue);
            });
        }
    }

    return store;
});
