import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {
    
    // Application settings
    const appMode = ref('basic');       // basic | advanced
    const darkMode = ref('auto');       // auto | light | dark
    const userLocale = ref('en');       // en | sv | hu 
    const conversationMode = ref(true);
    const chatDirection = ref('up');    // up | down

    // OpenAI settings
    const apiKey = ref('');
    // Chat completion settings
    const modelOptions = ref(['gpt-3.5-turbo', 'gpt-4']);
    const model = ref('gpt-3.5-turbo');
    const maxTokens = ref(2096);
    const temperature = ref(0.2);
    // Image settings
    const choices = ref(1);
    const imageSize = ref('1024x1024');

    return {
        // Application settings
        appMode,
        darkMode,
        userLocale,
        conversationMode,
        chatDirection,

        // OpenAI settings
        apiKey,
        modelOptions,
        model,
        maxTokens,
        temperature,
        choices,
        imageSize
    }
});