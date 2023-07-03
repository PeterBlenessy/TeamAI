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
            send: 'Send your question',
        },
    },

    toolbar: {
        tooltip: {
            newConversation: 'New conversation',
            clear: 'Clear messages',
            personas: 'Show personas',
            addTeam: 'Add a new team',
            info: 'Info',
            settings: 'Show settings',
            history: 'Show conversations'
        },
    },
    settings: {
        darkMode: {
            label: 'Dark mode',
            caption: 'Toggle dark/auto/light mode',
            tooltip: 'Toggle dark/auto/light mode'
        },
        locale: {
            label: 'Application language',
            caption: 'Select the preferred application language',
            tooltip: 'Select the preferred application language'
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
                tooltip: 'The OpenAI model to use for generating the response.'
            },
            maxTokens: {
                label: 'Max tokens',
                tooltip: 'The maximum number of tokens in the response.'
            },
            choices: {
                label: 'Choices',
                tooltip: 'Number of responses to generate for each question.'
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

    page: {},

    info: {
        title: 'Info',
        content: 'The TeamAI application allows the user to create a team of OpenAI powered bots with individual capabilities, personas. The bots will solve the task requested by the user as a team effort, each bot contributing with its respective capabilities.'
    },
    history: {
        title: 'Conversations',
        delete: 'Delete'
    },
    prompts: {
        generateTitle: 'Generate a title for this conversation.'
    },
    personas: {
        title: 'Personas',
        description: 'Personas are AI assistants configured to have specific abilities and behaviour. The configuration is obtained by using specially crafted system messages. The system messages are sent to the AI assistant before the user message.',
        actions: {
            add: {
                label: 'Add a new persona',
                caption: 'Add a new persona and specify the abilities and behaviour you desire it to have.',
                tooltip: 'Add a new persona'
            },
            import: {
                label: 'Import personas',
                caption: 'Import personas from Awesome ChatGPT prompts. This GitHub repository holds a collection of prompt examples that can be used with GPT models. These prompts are in English.',
                tooltip: 'Import personas from Awesome ChatGPT prompts'
            },
            edit: {
                tooltip: 'Edit'
            },
            delete: {
                tooltip: 'Delete'
            }
        },
        tableHeading: {
            name: 'Name',
            prompt: 'System message'
        }
    }
}