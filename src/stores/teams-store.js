import { ref } from 'vue';
import { defineStore } from 'pinia';
import { imageDB } from '@/services/localforage';
import logger from '@/services/logger';

// The teams-store holds the teams creeated by the user in a list. A team is a list of AI assistants, bots
// Each team object has an array of team member objects and an array of messages.
// Each team member is essentially an OpenAI assistant, with a user defined configuration.
// A message is an objects with a role and content, e.g., { role: "user", content: "Hello"}
// The role is either "user" or "assistant", or optionally "system".
// The "system" message is used to set the behavior of the assistant, i.e. each team member.
//      e.g., { role: "system", content: "You are a helpful assistant." }

export const useTeamsStore = defineStore('teams', () => {

    // ---------------------------------------------------------------------------------------------
    // State properties
    // ---------------------------------------------------------------------------------------------

    // Long term state properties
    const messages = ref([]);   // { conversationId, timestamp, role, content | choices: [{index, content}], object, usage, settings: { (model, maxTokens, temperature) | (choices, imageSize), personas, speechLanguage, conversationMode } ]
    const history = ref([]);    // { conversationId, timestamp, created, updated, title }
    const personas = ref([{ id: 0, name: "Default assistant", prompt: "You are a helpful assistant. Format your response in markdown format using GitHub flavor. Do not comment about markdown. Do not explain that you are an AI model.", avatar: null, readonly: true }]);   // { id, name, prompt, avatar, readonly }
    const teams = ref([]);

    // Active conversation states
    const userInput = ref('');
    const conversationId = ref('');
    const loading = ref(false);
    const abortRequest = ref(false);

    // Generate chat or image
    const isCreateImageSelected = ref(false);

    // The user input is a team assignment
    const isTeamWorkActivated = ref(false);

    // ---------------------------------------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------------------------------------

    // Delete message identified by 'timestamp'
    function deleteMessage(timestamp, role) {
        messages.value = messages.value.filter(message => {
            if (!(message.timestamp == timestamp && message.role == role)) {
                return message;
            } else {
                // Delete image from image storage
                if (message.hasOwnProperty("choices")) {
                    message.choices.forEach(choice => {
                        // Delete image from image storage
                        imageDB.removeItem(choice.content)
                            .then(() => logger.log(`[teams-store] - Deleted image from message: ${choice.content}`))
                            .catch(error => logger.error(`[teams-store] - deleteMessage() error when deleting image:  ${choice.content}, ${error.toString()}`));
                    });
                }
                return;
            }
        });
    }

    // Remove all messages for the given 'conversationId'
    function deleteMessages(id) {
        if (id == '') {
            // Delete orphaned messages
            let orphanedMessages = getOrphanedMessages();
            orphanedMessages.forEach(message => deleteMessage(message.timestamp, message.role));

            // Delete orphaned images
            deleteOrphanedImages();

        } if (id == undefined) {
            // Delete messages in current conversation, if conversationId not set
            // This should not happen, but just in case
            messages.value = messages.value.filter(message => {
                if (message.conversationId != conversationId.value) {
                    return message;
                } else {
                    deleteMessage(message.timestamp, message.role);
                }
            });
        } else {
            // Delete messages for a given conversation
            messages.value = messages.value.filter(message => {
                if (message.conversationId != id) {
                    return message;
                } else {
                    deleteMessage(message.timestamp, message.role);
                }
            });
        }

        loading.value = false; // Just in case UI hangs due to some unhandled error
    }

    // Create a new conversation
    function newConversation() {
        conversationId.value = Date.now().toString();
    }

    // Delete a conversation given a 'conversationId'
    function deleteConversation(id) {
        // Remove conversation from history
        history.value = history.value.filter(conversation => conversation.conversationId != id);
        // Delete messages
        deleteMessages(id);

        if (conversationId.value == id) {
            newConversation();
        }
    }

    // Delete a 'choice' from messages, given the 'timestamp' of the message and the 'index' of the choice
    function deleteChoice(timestamp, role, index) {
        messages.value = messages.value.map(message => {
            if (message.timestamp == timestamp && message.role == role) {
                message.choices = message.choices.filter(choice => {
                    if (choice.index != index) {
                        return choice;
                    } else {
                        // Delete image from image storage
                        imageDB.removeItem(choice.content)
                            .then(() => logger.log(`[teams-store] - Deleted image from message: ${choice.content}`))
                            .catch(error => logger.error(`[teams-store] - deleteChoice() error when deleting image:  ${choice.content}, ${error.toString()}`));
                        return;
                    }
                });
            }
            return message;
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Getters
    // ---------------------------------------------------------------------------------------------

    // Returns message from timestamp and role
    function getMessage(timestamp, role) {
        return messages.value.filter(message => message.timestamp == timestamp && message.role == role)[0];
    }

    // Returns conversation as a JSON object
    function getConversation(id) {
        return messages.value.filter(message => message.conversationId == id);
    }

    // Returns the conversations metadata, such as title, created date, etc.
    function getConversationInfo(id) {
        return history.value.filter(conversation => conversation.conversationId == id)[0];
    }

    function getConversationIds() {
        return messages.value.map(message => message.conversationId);
    }
    function getOrphanedMessages() {
        let conversationIds = getConversationIds();
        return messages.value.filter(message => conversationIds.includes(message.conversationId) == false);
    }

    function deleteOrphanedImages() {
        let allImages = [];
        messages.value.forEach(message => {
            if (message.hasOwnProperty("choices")) {
                message.choices.forEach(choice => {
                    allImages.push(choice.content);
                });
            }
        });

        // Remove images from imageDB that are not referenced from the messages
        imageDB.iterate((value, key, iterationNumber) => {
            if (!allImages.includes(key)) {
                imageDB.removeItem(key)
                    .then(() => logger.log(`[teams-store] - Deleted image: ${key}`))
                    .catch(error => logger.error(`[teams-store] - deleteOrphanedImages() error when deleting image: ${key}, ${error.toString()}`));
            }
        }).then(() => {
            // Restore the persisted state
        }).catch((error) => {
            logger.error(`[teams-store] - deleteOrphanedImages() error: ${error.toString()}`);
        }).finally(() => {
            logger.log(`[teams-store] - Done iterating imageDB`);
        });
    }

    // Get settings from last assistant message in a conversation
    function getSettingsFromLastMessage(id) {
        const conversation = messages.value.filter(message => message.conversationId == id);

        // Find latest assistant message with settings
        for (let i = conversation.length - 1; i >= 0; i--) {
            if (conversation[i].role == "assistant" &&
                conversation[i].hasOwnProperty("settings") &&
                Object.keys(conversation[i].settings).length !== 0) {

                // Return a copy of the settings object, to avoid reactive state changes
                return { ...conversation[i].settings };
            }
        }
    }

    function getUserMessage(id, offset = 0) {
        const conversation = messages.value.filter(message => message.conversationId == id);
        const userMessages = conversation.filter(message => message.role === "user");
        
        if (userMessages.length === 0 || offset < 0) {
            return undefined;
        }
        
        const targetIndex = userMessages.length - 1 - offset;
        return targetIndex >= 0 ? userMessages[targetIndex] : undefined;
    }

    function getPersona(id) {
        return personas.value.filter(persona => persona.id == id)[0];
    }

    function getPersonasFromConversation(id) {
        return history.value.filter(conversation => conversation.conversationId == id)[0].personas;
    }

    function getPersonaFromConversation(personaId, conversationId) {
        return getPersonasFromConversation(conversationId).filter(persona => persona.id == personaId)[0];
    }

    return {
        // Long term state properties
        messages,
        history,
        personas,
        teams,
        // Active conversation states
        userInput,
        conversationId,
        loading,
        abortRequest,

        // Generate chat or image
        isCreateImageSelected,

        // The user input is a team assignment        
        isTeamWorkActivated,

        // Image and avatar objectURL arrays
        refreshObjectURLs: ref(false),

        // Actions
        newConversation,
        deleteMessage,
        deleteMessages,
        deleteConversation,
        deleteChoice,

        // Getters
        getConversation,
        getConversationInfo,
        getMessage,
        getUserMessage,
        getOrphanedMessages,
        getSettingsFromLastMessage,
        getPersona,
        getPersonaFromConversation
    }
});