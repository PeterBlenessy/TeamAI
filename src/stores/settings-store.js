import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { settingsDB } from '../services/localforage';

export const useSettingsStore = defineStore('settings', () => {

    // Application settings
    const darkMode = ref('auto');
    settingsDB.getItem('darkMode').then( (value) => { if (value !== null) darkMode.value = value })
    watch( darkMode, () => { settingsDB.setItem('darkMode', darkMode.value) } );

    // OpenAI settings
    const apiKey = ref('');
    settingsDB.getItem('apiKey').then( (value) => { if (value !== null) apiKey.value = value })
    watch( apiKey, () => { settingsDB.setItem('apiKey', apiKey.value) } );

    const modelOptions = ref(['gpt-3.5-turbo', 'gpt-4']);
    settingsDB.getItem('modelOptions').then( (value) => { if (value !== null) modelOptions.value = value })
    watch( modelOptions, () => { settingsDB.setItem('modelOptions', modelOptions.value) } );

    const model = ref('gpt-3.5-turbo');
    settingsDB.getItem('model').then( (value) => { if (value !== null) model.value = value })
    watch( model, () => { settingsDB.setItem('model', model.value) } );

    const maxTokens = ref(512);
    settingsDB.getItem('maxTokens').then( (value) => { if (value !== null) maxTokens.value = value })
    watch( maxTokens, () => { settingsDB.setItem('maxTokens', maxTokens.value) } );

    const choices = ref(1);
    settingsDB.getItem('choices').then( (value) => { if (value !== null) choices.value = value })
    watch( choices, () => { settingsDB.setItem('choices', choices.value) } );

    const temperature = ref(0.2);
    settingsDB.getItem('temperature').then( (value) => { if (value !== null) temperature.value = value })
    watch( temperature, () => { settingsDB.setItem('temperature', temperature.value) } );

    return {
        // Application settings
        darkMode,

        // OpenAI settings
        apiKey,
        modelOptions,
        model,
        maxTokens,
        choices,
        temperature
    }
});