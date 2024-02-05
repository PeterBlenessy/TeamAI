<template></template>

<script>

import { watch, nextTick } from 'vue';
import { useTeamsStore } from '../stores/teams-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';
import OpenAI from '../services/openai.js';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import MarkdownIt from "markdown-it";
import hljs from 'highlight.js/lib/common';

//import 'highlight.js/styles/devibeans.css';
import 'highlight.js/styles/github-dark.css';
//import 'highlight.js/styles/base16/google-dark.css';

import logger from '../services/logger.js';

export default {
    name: 'OpenAI',
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();

        const teamsStore = useTeamsStore();
        const { loading, abortRequest, conversationId, messages, history, userInput, isCreateImageSelected, isTeamWorkActivated } = storeToRefs(teamsStore);

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
        // Returns the index of a specific conversation
        // -----------------------------------------------------------------------------------------
        const getConversationIndex = (id) => {
            return history.value.findIndex(item => item.conversationId == id);
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
                logger.error(error);
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

        let abortController;
        // -----------------------------------------------------------------------------------------
        // Watch if user aborts response and call abortController abort function
        // -----------------------------------------------------------------------------------------
        watch (abortRequest, () => {
            try {
                if (abortRequest.value) {
                    logger.log('Aborting generation');
                    loading.value = false;
                    abortController.abort();
                }
            } catch (error) {
                logger.error(error);
                abortRequest.value = false;
                loading.value = false;
            }
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

                        abortController = new AbortController();
                        response = await openAI.createChatCompletion([...systemMessages, ...conversation], streamResponse.value, abortController.signal);

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
                    const timestamp = Date.now().toString();
                    // Add response to messages. This will trigger an update of the UI.
                    messages.value.push({
                        timestamp: timestamp, //Date.now().toString(), // Keep here to make timestamp unique
                        conversationId: conversationId.value,
                        ...assistantMessage,
                        systemMessages: systemMessages
                    });

                    // Wait for Vue to update the DOM and make the new message element available, before continuing
                    await nextTick();
                    let md = new MarkdownIt({
                        html: true, // Enable HTML tags in source
                        xhtmlOut: true, // Use '/' to close single tags (<br />).
                        breaks: true, // Convert '\n' in paragraphs into <br>
                        linkify: true, // Autoconvert URL-like text to links
                        typographer: true, // Enable some language-neutral replacement + quotes beautification
                        quotes: '“”‘’',
                        highlight: function (str, lang) {
                            if (lang && hljs.getLanguage(lang)) {
                                try {
                                    return '<pre class="hljs"><code>' +
                                        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                                        '</code></pre>';
                                } catch (__) { }
                            }

                            return '';
                        }
                    });

                    // Handle the streamed response, i.e. the response is streamed in chunks
                    if (streamResponse.value) {

                        const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
                        if (!reader) return;

                        // Reference to the last message from the current conversation, so we can update its content with new chunks of text.
                        const lastMessage = messages.value[messages.value.length - 1];

                        // Update the DOM directly to avoid performance degradation and lost content 
                        // due to frequent virtual DOM updates while receiving the chunks.
                        const contentElement = document.getElementById('content-' + timestamp);
                        let messageContent = '';

                        try {
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

                                    if (role) lastMessage.role = role;
                                    // Save recieved content; will add it to last message's content when all chunks are recieved
                                    if (content) messageContent += content;
                                    // Render recieved content as markdown
                                    if (contentElement && content) contentElement.innerHTML = md.render(messageContent);
                                });

                                assistantMessage.object = 'chat.completion';

                                // TODO: Calculate token usage manually since it's not available when streaming the response
                                // Check out: https://github.com/dqbd/tiktoken

                                if (dataDone) break;
                            }
                        } catch (error) {
                            throw new Error(error);
                        } finally {
                            // Make sure to store the resulting content in the lastMessage object
                            // This will trigger an update of the DOM in Messages component and replace the content rendered while recieving the chunks.
                            if (messageContent) lastMessage.content = messageContent;
                        }
                    }
                    // Check if conversation and conversation title exists, create or update it if needed
                    let conversationTitle = '';
                    const conversationIndex = getConversationIndex(conversationId.value);
                    if (conversationIndex != -1) conversationTitle = history.value[conversationIndex].title;
                    if (!conversationTitle) {
                        generateConversationTitle(conversationId.value)
                            .then((title) => conversationTitle = title)
                            .catch(error => logger.error(error))
                            .finally(() => {
                                const timestamp = Date.now().toString();
                                if (conversationIndex != -1) {
                                    // Conversation exists, update its title and timestamp
                                    history.value[conversationIndex].title = conversationTitle;
                                    history.value[conversationIndex].updated = timestamp;
                                } else {
                                    // Conversation doesn't exist, create it
                                    history.value.push({
                                        title: conversationTitle,
                                        timestamp: timestamp,
                                        created: timestamp,
                                        updated: timestamp,
                                        conversationId: conversationId.value,
                                        personas: personas.value
                                    });
                                }
                            });
                    }

                } catch (error) {
                    let message = ''
                    let caption = ''

                    if (error.response) {
                        message = error.response.status;
                        caption = error.response.data;
                    } else { 

                        // Check if user aborted the request
                        if (error.message == 'AbortError: Fetch is aborted') {
                            logger.log("Generation aborted");
                            abortController = '';
                            return;
                        }
                        const path = 'apiErrors.' + error.message.split(' ')[0];

                        // Check if error message is defined in i18n language files
                        try { 
                            message = t(path + '.message');
                            caption = t(path + '.caption');
                        } catch (error) {
                            message = "Unknown error occured. ";
                            caption = error.message;
                        }
                    }
                    logger.error(message + ' ' + caption);

                    // Show error message in app
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
                    abortRequest.value = false;
                };

                // Break out of the personas for loop when generating images.
                if (isCreateImageSelected.value) break;
            }
        }

        return {};
    }
}
</script>
