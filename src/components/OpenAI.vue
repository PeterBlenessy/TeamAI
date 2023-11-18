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
        const $q = useQuasar();
        const { t } = useI18n();

        const teamsStore = useTeamsStore();
        const { loading, conversationId, messages, history, userInput, isCreateImageSelected, isTeamWorkActivated } = storeToRefs(teamsStore);

        const settingsStore = useSettingsStore();
        const { conversationMode, maxTokens, model, personas, speechLanguage, streamResponse, temperature, } = storeToRefs(settingsStore);

        const openAI = OpenAI();

        // -----------------------------------------------------------------------------------------
        // Creates an array of OpenAI API message objects from the current conversation.
        // Filters out potentially undefined items and items containing images, as these cause OpenAI API errors.
        // -----------------------------------------------------------------------------------------
        const getMessages = (id) => {
            let msg = messages.value.map(message => {
                if (message && message.conversationId == id && message.object != 'image') {
                    return { "role": message.role, "content": message.content };
                }
            }).filter(item => item !== undefined)

            return msg;
        }

        // -----------------------------------------------------------------------------------------
        // Returns an array of the messages of a specific conversation
        // -----------------------------------------------------------------------------------------
        const getConversation = (id) => {
            return history.value.filter(item => item.conversationId == id);
        }

        // -----------------------------------------------------------------------------------------
        // Generate conversation title
        // -----------------------------------------------------------------------------------------
        const generateConversationTitle = async (id) => {
            try {
                let response = await openAI.createChatCompletion([
                    { "role": "user", "content": t('prompts.generateTitle') },
                    [...getMessages(id)][0]
                ], false);
                const json = await response.json();
                if (json.errorCode) throw new Error(`${data.errorCode}`);
                // Remove (occasional) optionally escaped leading and trailing apostrophes
                return json.choices[0].message.content.trim().replace(/^\\?"|\\?"$/g, '');
            } catch (error) {
                console.error(error);
                throw new Error(error);
            }
        }

        // -----------------------------------------------------------------------------------------
        // Watch runtime changes to user input and send question to OpenAI API
        // -----------------------------------------------------------------------------------------
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

        // -----------------------------------------------------------------------------------------
        // Ask question to OpenAI API
        // -----------------------------------------------------------------------------------------
        const askQuestion = async (question) => {
            loading.value = true;

            let count = isCreateImageSelected.value ? 1 : personas.value.length;
            let assistantMessage = '';
            let systemMessages = '';
            let response = '';

            for (const persona of personas.value) {

                try {
                    // Make the right API call
                    if (isCreateImageSelected.value) {
                        assistantMessage = await openAI.createImageCompletion(question);
                    } else {
                        // Always add default persona prompt as system message
                        systemMessages = [{ "role": "system", "content": teamsStore.personas[0].prompt }];
                        if (persona.id != 0) systemMessages.push({ "role": "system", "content": persona.prompt });

                        let conversation = '';
                        if (isTeamWorkActivated.value && assistantMessage != '') {
                            conversation = [{ "role": "user", "content": assistantMessage.content }];
                        } else if (conversationMode.value) {
                            conversation = getMessages(conversationId.value);
                        } else {
                            conversation = [{ "role": "user", "content": question }];
                        }

                        response = await openAI.createChatCompletion([...systemMessages, ...conversation], streamResponse.value);

                        // Add common parameters to assistantMessage
                        assistantMessage = {
                            role: '',
                            content: '',
                            settings: {
                                model: model.value,
                                maxTokens: maxTokens.value,
                                temperature: temperature.value,
                                persona: persona, // Current persona
                                personas: personas.value, // All personas, to be able to re-load settings
                                conversationMode: conversationMode.value
                            }
                        };

                        // We have a regular chat completion, with all the generated text in the response
                        if (!streamResponse.value) {
                            const json = await response.json();
                            if (json.errorCode) throw new Error(`${data.errorCode}`);

                            // Add parameters from chat.completion message
                            assistantMessage.role = json.choices[0].message.role,
                                assistantMessage.content = json.choices[0].message.content,
                                assistantMessage.object = json.object,
                                assistantMessage.usage = json.usage;
                        }
                    }

                    assistantMessage.settings.speechLanguage = speechLanguage.value;

                    // Add response to messages. This will trigger an update of the UI.
                    messages.value.push({
                        timestamp: Date.now().toString(), // Keep here to make timestamp unique
                        conversationId: conversationId.value,
                        ...assistantMessage,
                        systemMessages: systemMessages
                    });

                    // Handle the streamed response, i.e. the response is streamed in chunks
                    if (streamResponse.value) {

                        const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
                        if (!reader) return;

                        // Reference to the last message from the current conversation, so we can update its content with new chunks of text.
                        const lastMessage = messages.value[messages.value.length - 1];

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            let dataDone = false;
                            const linesRead = value.split("\n");

                            linesRead.forEach(line => {
                                if (line.length === 0) return; // ignore empty message
                                if (line.startsWith(':')) return; // ignore SSE (Server Sent Event) comment message
                                if (line === 'data: [DONE]') {
                                    dataDone = true;
                                    return;
                                }
                                const chunk = JSON.parse(line.substring(6)); // Skip 'data: '
                                const { choices } = chunk;
                                const { delta } = choices[0]; // we have only one choice, 'n' is always 1
                                const { role, content } = delta;
                                if (content) lastMessage.content += content;
                                if (role) lastMessage.role = role;
                            });
                            assistantMessage.object = 'chat.completion';

                            // TODO: Calculate token usage manually since it's not available when streaming the response
                            // Check out: https://github.com/dqbd/tiktoken

                            if (dataDone) break;
                        }
                    }

                    // Check if conversation title exists
                    // todo: if conversation title exists, update its 'updated' key to timestamp
                    if (getConversation(conversationId.value).length == 0) {
                        generateConversationTitle(conversationId.value)
                            .then((title) => {
                                const timestamp = Date.now().toString();
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
                            icon: 'mdi-close',
                            color: 'white',
                            handler: () => { /* ... */ }
                        }]
                    });

                } finally {
                    // Decrease remaining personas to keep loading indicator accurate
                    count--;
                    loading.value = count == 0 ? false : true;
                };

                // Break out of the personas for loop when generating images.
                if (isCreateImageSelected.value) break;
            }
        }

        return {};
    }
}
</script>
