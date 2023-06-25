// This is just an example,
// so you can safely delete all default props below

export default {
    general: {
        failed: 'Action failed',
        success: 'Action was successful'
    },

    userInput: {
        placeholder: 'Ask your question',
        tooltip: {
            send: 'Send question',
        },
    },

    toolbar: {
        tooltip: {
            clear: 'Clear messages',
            addTeam: 'Add a new team',
            info: 'Info',
            settings: 'Show settings'
        },
    },
    settings: {
        darkMode: {
            label: 'Dark mode',
            caption: 'Toggle dark/auto/light mode',
            tooltip: 'Toggle dark/auto/light mode'
        },
        conversationMode: {
            label: 'Conversation mode',
            caption: 'Send individual messages or entire conversation history',
            tooltip: 'Toggle conversation mode on/off'
        },

        openAI: {
            apiKey: {
                label: 'OpenAI API key',
                placeholder: 'Your OpenAI API key',
                tooltip: 'Your OpenAI API key. You can find it in your OpenAI dashboard.'
            },
            model: {
                label: 'OpenAI model',
                tooltip: 'The AI model to use for generating the response.'
            },
            maxTokens: {
                label: 'Max tokens',
                tooltip: 'The maximum number of tokens in the response.'
            },
            choices: {
                label: 'Choices',
                tooltip: 'Number of chat completion choices to generate for each input message.'
            },
            temperature: {
                label: 'Temperature',
                tooltip: 'Temperature is a measure of the randomness in the text. Lower values will result in more predictable text, while higher values will result in more surprising text.'
            }
        }
    },

    apiErrors: {
        '401': {
            message: 'Invalid Authentication.',
            caption: 'Please ensure that the OpenAI API key used is correct.'
        },
        '429': {
            message: 'Rate limit reached for requests, or the engine may be overloaded.',
            caption: 'Please retry your requests after a brief wait.'
        },
        '500': {
            message: 'The server had an error while processing your request.',
            caption: 'Please retry your request after a brief wait and contact us if the issue persists.'
        },
        '400': {
            message: 'The request seams invalid.',
            caption: 'Please check your request and try again.'
        }
    },

    page: {}
}