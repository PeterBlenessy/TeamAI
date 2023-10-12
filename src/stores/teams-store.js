import { ref } from 'vue';
import { defineStore } from 'pinia';
import { imageDB } from '../services/localforage';

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
                        .then(() => console.log("Deleted image: ", choice.content))
                        .catch(error => console.log("Error when deleting image: ", choice.content, error));
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
                        .then(() => console.log("Deleted image: ", choice.content))
                        .catch(error => console.log("Error when deleting image: ", choice.content, error));

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

    // Get message from timestamp
    function getMessage(timestamp, role) {
        return messages.value.filter(message => message.timestamp == timestamp && message.role == role)[0];
    }

    // Get messages from a conversation
    function getConversation(id) {
        return messages.value.filter(message => message.conversationId == id);
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
                .then(() => console.log("Deleted image: ", key))
                .catch(error => console.log("Error when deleting image: ", key, error));
            }
        }).then(() => {
            // Restore the persisted state
        }).catch((error) => {
            console.log(error);
        }).finally(() => {
            // console.log("Done iterating imageDB");
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

    function getPersona(id) {
        return personas.value.filter(persona => persona.id == id)[0];
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
        getMessage,
        getOrphanedMessages,
        getSettingsFromLastMessage,
        getPersona
    }
});