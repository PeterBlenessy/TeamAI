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
    const messages = ref([]);
    const systemMessage = ref("You are a helpful assistant. You respond like you were giving examples of how to format text in markdown format using GitHub flavor.");
    const userInput = ref('');
    const loading = ref(false);

    // Actions
    function clearMessages() {
        messages.value = [];
    }

    return {
        // State properties
        bots,
        teams,
        messages,
        systemMessage,
        userInput,
        loading,

        // Actions
        clearMessages
    }
});