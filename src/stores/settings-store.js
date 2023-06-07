import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {

    state: () => {
        return {
            // Application settings
            darkMode: 'auto',

            // OpenAI settings
            apiKey: '',
            modelOptions: ['gpt-3.5-turbo', 'gpt-4'],
            model: 'gpt-3.5-turbo',
            maxTokens: 512,
            choices: 1,
            temperature: 0.2
        }
    }
});