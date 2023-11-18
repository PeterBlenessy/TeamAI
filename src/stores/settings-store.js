import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {

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

        // OpenAI settings
        apiKey: ref(''),

        // Chat completion settings
        model: ref('gpt-4-1106-preview'),
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
    }
});