<template></template>

<script>

import { watch } from 'vue';
import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';
import OpenAI from '../services/openai.js';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

export default {
    name: 'OpenAI',
    setup() {
        const teamsStore = useTeamsStore();
        const { loading, messages, userInput } = storeToRefs(teamsStore);
        const $q = useQuasar();
        const { t } = useI18n();

        const openAI = OpenAI([]);

        // Watch runtime changes to user input
        watch(userInput, () => {
            if (userInput.value != '') {
                askQuestion(userInput.value);
            }
        });

        const askQuestion = async (question) => {
            loading.value = true;
            try {
                let response = await openAI.createChatCompletion([{ "role": "user", "content": question }]);
                messages.value.push({
                    role: response.role,
                    content: response.content,
                    timestamp: new Date().toLocaleString()
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
