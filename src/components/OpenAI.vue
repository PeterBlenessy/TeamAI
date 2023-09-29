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
        const { loading, conversationId, messages, history, userInput, isCreateImageSelected, isTeamWorkActivated } = storeToRefs(teamsStore);

        const settingsStore = useSettingsStore();
        const { conversationMode, personas, speechLanguage } = storeToRefs(settingsStore);

        // Creates an array of OpenAI API message objects from the current conversation.
        // Filters out potentially undefined items and items containing images, as these cause OpenAI API errors.
        const getMessages = (id) => {
            let msg = messages.value.map(message => {
                if (message && message.conversationId == id && message.object != 'image') {
                    return { "role": message.role, "content": message.content };
                }
            }).filter(item => item !== undefined)

            return msg;
        }

        const getConversation = (id) => {
            return history.value.filter(item => item.conversationId == id);
        }

        const $q = useQuasar();
        const { t } = useI18n();

        const openAI = OpenAI();

        // Watch runtime changes to user input
        watch(userInput, () => {

            if (userInput.value == '') {
                return;
            }

            // Generate conversationId if needed
            if (conversationId.value == '') {
                teamsStore.newConversation();
            }

            // Add user input to messages
            messages.value.push({
                role: 'user',
                content: userInput.value,
                timestamp: Date.now().toString(),
                conversationId: conversationId.value,
                model: 0
            });

            askQuestion(userInput.value);
            userInput.value = '';
        });

        // Generate conversation title
        const generateConversationTitle = async (id) => {
            try {
                let response = await openAI.createChatCompletion([
                    { "role": "user", "content": t('prompts.generateTitle') },
                    [...getMessages(id)][0]
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

            let count = personas.value.length;
            let response = '';
            let systemMessages = '';

            for (const persona of personas.value) {

                try {

                    const timestamp = Date.now().toString();

                    // Make the right API call
                    if (isCreateImageSelected.value) {
                        response = await openAI.createImageCompletion(question);
                    } else {
                        // Always add default persona prompt as system message
                        systemMessages = [{ "role": "system", "content": teamsStore.personas[0].prompt }];
                        if (persona.id != 0) systemMessages.push({ "role": "system", "content": persona.prompt });

                        let conversation = '';
                        if (isTeamWorkActivated.value && response != '') {
                            conversation = [{ "role": "user", "content": response.content }];
                        } else if (conversationMode.value) {
                            conversation =  getMessages(conversationId.value);
                        } else {
                            conversation = [{ "role": "user", "content": question }];
                        }

                        response = await openAI.createChatCompletion([...systemMessages, ...conversation]);
                        response.settings.persona = persona; // Current persona
                        response.settings.personas = personas.value; // All personas, to be able to re-load settings
                        response.settings.conversationMode = conversationMode.value;
                    }

                    response.settings.speechLanguage = speechLanguage.value;

                    // Add response to messages
                    messages.value.push({
                        timestamp: timestamp,
                        conversationId: conversationId.value,
                        ...response,
                        systemMessages: systemMessages
                    });

                    // Check if conversation title exists
                    // todo: if conversation title exists, update its 'updated' key to timestamp
                    if (getConversation(conversationId.value).length == 0) {
                        generateConversationTitle(conversationId.value)
                            .then((title) => {
                                history.value.push({
                                    title: title,
                                    timestamp: timestamp,
                                    created: timestamp,
                                    updated: timestamp,
                                    conversationId: conversationId.value,
                                    personas: personas.value
                                });
                            })
                            .catch(error => console.error(error))
                    }

                    // Decrease remaining personas to keep loading indicator accurate
                    count--;
                    
                    // Break out of the personas for loop when generating images.
                    if (isCreateImageSelected.value) break;

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
                    });
                } finally {
                    loading.value = count == 0 ? false : true;
                };
            }
        }

        return {}
    }
}
</script>
