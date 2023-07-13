import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {
    
    // Application settings
    const darkMode = ref('auto');
    const userLocale = ref('en');
    const conversationMode = ref(true);

    // OpenAI settings
    const apiKey = ref('');
    const modelOptions = ref(['gpt-3.5-turbo', 'gpt-4']);
    const model = ref('gpt-3.5-turbo');
    const maxTokens = ref(2096);
    const choices = ref(1);
    const temperature = ref(0.2);

    return {
        // Application settings
        darkMode,
        userLocale,
        conversationMode,

        // OpenAI settings
        apiKey,
        modelOptions,
        model,
        maxTokens,
        choices,
        temperature
    }
});