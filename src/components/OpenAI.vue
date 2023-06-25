<template></template>

<script>

import { watch } from 'vue';
import { useTeamsStore } from '../stores/teams-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';
import OpenAI from '../services/openai.js';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

export default {
    name: 'OpenAI',
    setup() {
        const teamsStore = useTeamsStore();
        const { loading, messages, userInput, systemMessage } = storeToRefs(teamsStore);

        const settingsStore = useSettingsStore();
        const { conversationMode } = storeToRefs(settingsStore);

        const getMessages = (conversationId) => {
            //return messages.value.filter(message => message.id == id);
            return messages.value.map(message => { 
                if (message.conversationId == conversationId) {
                    return { "role": message.role, "content": message.content };
                }
            })
        }

        const $q = useQuasar();
        const { t } = useI18n();

        const openAI = OpenAI();
        // Todo: implement conversationId generation.
        const conversationId = 1;

        // Watch runtime changes to user input
        watch(userInput, () => {
            if (userInput.value != '') {
                messages.value.push({
                    role: 'user',
                    content: userInput.value,
                    timestamp: new Date().toLocaleString(),
                    conversationId: conversationId
                });

                askQuestion(userInput.value);
                userInput.value = '';
            }
        });

        const askQuestion = async (question) => {
            loading.value = true;
            let conversation = (!conversationMode.value) ? [{ "role": "user", "content": question }] : getMessages(1);
            try {
                let response = await openAI.createChatCompletion([
                    { "role": "system", "content": systemMessage.value},
                    ...conversation
                ]);
                messages.value.push({
                    role: response.role,
                    content: response.content,
                    timestamp: new Date().toLocaleString(),
                    conversationId: conversationId
                });
            } catch (error) {
                let message = ''
                let caption = ''

                if (error.response) {
                    message = error.response.status;
                    caption = error.response.data;
                } else {
                    const path = 'apiErrors.' + error.message.split(' ')[0];

                    // Check if error message is defined in i18n language files
                    if ((path + '.message') == t(path + '.message')) {
                        message = "Unknown error occured. ";
                        caption = error.message;
                    } else {
                        message = t(path + '.message');
                        caption = t(path + '.caption');
                    }
                }

                $q.notify({
                    type: 'negative',
                    position: 'top',
                    html: true,
                    progress: true,
                    caption: caption,
                    message: message,
                    actions: [{
                        icon: 'close',
                        color: 'white',
                        handler: () => { /* ... */ }
                    }]
                })
            }
            loading.value = false;
        }

        return {}
    }
}
</script>
