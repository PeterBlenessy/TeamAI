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

        // OpenAI settings
        apiKey: ref(''),

        // Models - NOT USED YET
        models: ref([
            { type: 'text', id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, contextWindow: 4096, description: '' },
            { type: 'text', id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16k', maxTokens: 4096, contextWindow: 16385, description: '' },

            { type: 'text', id: 'gpt-4', name: 'GPT-4', maxTokens: 4096, contextWindow: 8192, description: '' },
            { type: 'text', id: 'gpt-4-32k', name: 'GPT-4 32k', maxTokens: 4096, contextWindow: 32768, description: '' },
            { type: 'text', id: 'gpt-4-1106-preview', name: 'GPT-4 Turbo (preview)', maxTokens: 4096, contextWindow: 128000, description: '' },
            { type: 'text', id: 'gpt-4-vision-preview', name: 'GPT-4 Turbo with Vision (preview)', maxTokens: 4096, contextWindow: 128000, description: '' }, ,

            { type: 'image', id: 'dall-e-2', name: 'DALL·E 2', imageSize: ['256x256', '512x512', '1024x1024'], description: '' },
            { type: 'image', id: 'dall-e-3', name: 'DALL·E 3', imageSize: ['1024x1024', '1024x1792', '1792x1024'], imageQuality: ['standard', 'hd'], description: '' },

            { type: 'tts', id: '', name: '', description: 'Text-to-speech' },
            { type: 'stt', id: '', name: '', description: 'Speech-to-text' }
        ]),

        // Chat completion settings
        modelOptions: ref(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-1106-preview']),
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