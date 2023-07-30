import { ref } from 'vue';
import { defineStore } from 'pinia';

// The teams-store holds the teams creeated by the user in a list. A team is a list of AI assistants, bots
// Each team object has an array of team member objects and an array of messages.
// Each team member is essentially an OpenAI assistant, with a user defined configuration.
// A message is an objects with a role and content, e.g., { role: "user", content: "Hello"}
// The role is either "user" or "assistant", or optionally "system".
// The "system" message is used to set the behavior of the assistant, i.e. each team member.
//      e.g., { role: "system", content: "You are a helpful assistant." }

export const useTeamsStore = defineStore('teams', () => {

    // State properties
    const bots = ref([]);
    const teams = ref([]);
    const messages = ref([]);   // { conversationId, timestamp, role, content | choices: [{index, content}], objet, usage ]
    const history = ref([]);    // { conversationId, timestamp, created, updated, title }
    const systemMessage = ref("You are a helpful assistant. Format your response in markdown format using GitHub flavor. Do not comment about markdown. Do not explain that you are an AI model.");
    const personas = ref([{persona: "Helpful assistant", prompt: "You are a helpful assistant. Format your response in markdown format using GitHub flavor. Do not comment about markdown. Do not explain that you are an AI model."}]);   // { persona, prompt }
    const userInput = ref('');
    const conversationId = ref('');
    const loading = ref(false);
    const isCreateImageSelected = ref(false);

    // Actions

    // Delete message identified by 'timestamp'
    function deleteMessage(timestamp) {
        messages.value = messages.value.filter(message => message.timestamp != timestamp);
    }

    // Remove all messages for the given 'conversationId'
    function deleteMessages(id) {
        if (id == '' || id == undefined) {
            messages.value = messages.value.filter(message => message.conversationId != conversationId.value);
        } else {
            messages.value = messages.value.filter(message => message.conversationId != id);
        }

        loading.value = false; // Just in case UI hangs due to some unhandled error
    }

    // Create a new conversation
    function newConversation() {
        conversationId.value = Date.now().toString();
    }

    // Delete a conversation given a 'conversationId'
    function deleteConversation(id) {
        history.value = history.value.filter(conversation => conversation.conversationId != id);

        deleteMessages(id);

        if (conversationId.value == id) {
            conversationId.value = '';
        }
    }

    // Delete a 'choice' from messages, given the 'timestamp' of the message and the 'index' of the choice
    function deleteChoice(timestamp, index) {
        messages.value = messages.value.map(message => {
            if (message.timestamp == timestamp) {
                message.choices = message.choices.filter(choice => choice.index != index);
            }
            return message;
        });
    }

    // Getters
    function getMessages() {
        return messages.value.map(message => {
            if (message.conversationId == conversationId.value) {
                return { "role": message.role, "content": message.content };
            }
        });
    }

    // Get messages from a conversation
    function getConversation(id) {
        return messages.value.filter(message => message.conversationId == id);
    }

    return {
        // State properties
        bots,
        teams,
        messages,
        history,
        personas,
        systemMessage,
        userInput,
        conversationId,
        loading,
        isCreateImageSelected,

        // Actions
        newConversation,
        deleteMessage,
        deleteMessages,
        deleteConversation,
        deleteChoice,

        // Getters
        getConversation
    }
});