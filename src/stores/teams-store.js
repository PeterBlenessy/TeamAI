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
    const messages = ref([]);   // { conversationId, timestamp, role, content }
    const history = ref([]);     // { conversationId, timestamp, title }
    const systemMessage = ref("You are a helpful assistant. Format your response in markdown format using GitHub flavor. Do not comment about markdown. Do not explain that you are an AI model.");
    const userInput = ref('');
    const conversationId = ref('');
    const loading = ref(false);

    // Actions

    // Remove all messages for the given conversationId
    function deleteMessages(id='') {
        if (id == '') {
            messages.value = messages.value.filter(message => message.conversationId != conversationId.value);
        } else {
            messages.value = messages.value.filter(message => message.conversationId != id);
        }

        loading.value = false; // Just in case UI hangs due to some unhandled error
    }
    // Delete a conversation given a conversationId
    function deleteConversation(id) {
        history.value = history.value.filter(conversation => conversation.conversationId != id);

        deleteMessages(id);

        if (conversationId.value == id) {
            conversationId.value = '';
        }
    }

    // Create a new conversation
    function newConversation() {
        conversationId.value = Date.now().toString();
    }

    // Getters
    function getMessages() {
        return messages.value.map(message => {
            if (message.conversationId == conversationId.value) {
                return { "role": message.role, "content": message.content };
            }
        });
    }

    return {
        // State properties
        bots,
        teams,
        messages,
        history,
        systemMessage,
        userInput,
        conversationId,
        loading,

        // Actions
        newConversation,
        deleteMessages,
        deleteConversation,

        getMessages
    }
});