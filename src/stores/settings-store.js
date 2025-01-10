import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {

    // Add downloading models state
    const downloadingModels = ref([]);

    return {
        // Application settings
        appMode: ref('basic'),          // basic | advanced
        darkMode: ref('auto'),          // auto | light | dark
        userAvatar: ref(''),            // base64 encoded image
        userLocale: ref('en'),          // en | sv | hu
        speechLanguage: ref('en'),      // en | sv | hu
        conversationMode: ref(true),
        chatDirection: ref('up'),       // up | down
        quickSettings: ref(true),
        streamResponse: ref(true),

        // API settings
        apiProviders: ref([]),
        defaultProvider: ref('OpenAI'),     // OpenAI | Ollama | Custom
        apiKey: ref(''),

        // Chat completion settings
        model: ref('gpt-4o'),
        maxTokens: ref(4096),
        temperature: ref(0.2),

        // Image settings
        choices: ref(1),
        imageSize: ref('1024x1024'),
        imageQuality: ref('standard'),
        imageStyle: ref('vivid'),

        // Persona settings
        personas: ref([]),   // { avatar: '', name: '', prompt: '' }

        dBVersion: ref(0),
        isDBUpgraded: ref(false),

        lastSync: ref(null),

        // Cloud sync settings
        cloudSync: ref(false),          // Enable/disable cloud sync
        cloudProvider: ref('iCloud'),   // Current cloud provider
        lastSync: ref(null),           // Last sync timestamp
        syncOptions: ref({
            settings: true,      // Sync app settings
            personas: true,      // Sync personas
            conversations: false // Sync conversation history
        }),

        downloadingModels,    // Add to store exports
    }
});