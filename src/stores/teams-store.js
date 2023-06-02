import { defineStore } from 'pinia'

// The teams store is essentially an array of team objects.
// Each team object has an array of team member objects and an array of messages.
// Each team member is essentially an OpenAI assistant, with a user defined configuration.
// A message is an objects with a role and content, e.g., { role: "user", content: "Hello"}
// The role is either "user" or "assistant", or optionally "system".
// The "system" message is used to set the behavior of the assistant, i.e. each team member.
//      e.g., { role: "system", content: "You are a helpful assistant." }

export const useTeamsStore = defineStore('teams', {

    state: () => {
        return {
            teams: [],
            messages: [],
            systemMessage: "You are a helpful assistant. You respond like you were giving examples of how to format text in markdown format using GitHub flavor.",
            userInput: '',
            loading: false,
        }
    },

    actions: {
        clearMessages() {
            this.messages = []
        }
    }
})
