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
        const { loading, conversationId, messages, history, userInput, systemMessage } = storeToRefs(teamsStore);

        const settingsStore = useSettingsStore();
        const { conversationMode } = storeToRefs(settingsStore);

        // Creates an array of OpenAI API message objects from the current conversation
        const getMessages = (id) => {
            return messages.value.map(message => {
                if (message && message.conversationId == id) {
                    return { "role": message.role, "content": message.content };
                }
            });
        }

        const getConversation = (id) => {
            return history.value.filter(item => item.conversationId == id);
        }

        const $q = useQuasar();
        const { t } = useI18n();

        const openAI = OpenAI();

        // Watch runtime changes to user input
        watch(userInput, () => {
            if (userInput.value != '') {

                // Generate conversationId if needed
                if (conversationId.value == '') {
                    teamsStore.newConversation();
                }
                // Add user input to messages
                messages.value.push({
                    role: 'user',
                    content: userInput.value,
                    timestamp: Date.now(),
                    conversationId: conversationId.value
                });

                askQuestion(userInput.value);
                userInput.value = '';
            }
        });
        
        // Generate conversation title
        const generateConversationTitle = async (id) => {
            try {
                let response = await openAI.createChatCompletion([
                    { "role": "user", "content": t('prompts.generateTitle') },
                    ...getMessages(id)
                ]);
                // Remove (occasional) optionally escaped leading and trailing apostrophes
                return response.content.trim().replace(/^\\?"|\\?"$/g, '');
            }
            catch (error) {
                console.error(error);
            }
        }

        const askQuestion = async (question) => {
            loading.value = true;
            let conversation = (!conversationMode.value) ? [{ "role": "user", "content": question }] : getMessages(conversationId.value);
            conversation = conversation.filter(item => item !== undefined);

            try {
                let response = await openAI.createChatCompletion([
                    { "role": "system", "content": systemMessage.value },
                    ...conversation
                ]);
                const timestamp = Date.now().toString();
                messages.value.push({
                    role: response.role,
                    content: response.content,
                    timestamp: timestamp,
                    conversationId: conversationId.value
                });

                // Check if conversation title exists
                if (getConversation(conversationId.value).length == 0) {
                    generateConversationTitle(conversationId.value)
                    .then( (title) => {
                        history.value.push({
                            title: title,
                            timestamp: timestamp,
                            created: timestamp,
                            updated: timestamp,
                            conversationId: conversationId.value
                        });
                    })
                    .catch(error => console.error(error))
                }
                // todo: if conversation title exists, update its 'updated' key to timestamp
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
            } finally {
                loading.value = false;
            }
        }

        return {}
    }
}
</script>
