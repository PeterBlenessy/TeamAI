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
        title: 'Settings',
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
        appMode: {
            label: 'Application mode',
            caption: 'Use the application in basic or advanced mode',
            tooltip: 'Toggle basic/advanced application mode'
        },
        chatDirection: {
            label: 'Chat direction',
            caption: 'Change the direction of the chat messages up/down',
            tooltip: 'Change the direction of the chat messages up/down'
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
        title: 'Application description',
        description: 'The TeamAI application allows the user to create a team of OpenAI powered bots with individual capabilities, personas. The bots will solve the task requested by the user as a team effort, each bot contributing with its respective capabilities.',
        features: {
            title: 'Features',
            description: 'The application allows the user to create a team of OpenAI powered bots with individual capabilities, personas. The bots will solve the task requested by the user as a team effort, each bot contributing with its respective capabilities.',
            basic: {
                label: 'Basic mode',
                caption: 'In its basic mode, the application serves as a chat application, with the user being able to chat with a single AI bot. The bot is powered by OpenAI and can be configured by the user to have specific capabilities and behaviour.'
            },
            advanced: {
                label: 'Advanced mode',
                caption: 'In advanced mode, the user can create teams of several AI bots, each bot with a specific role, competences, behaviour and objective in the team. The user can assign a task to the team which will be solved in collaboration between the AI bots. Each bot is powered by OpenAI and can be configured by the user to have specific capabilities and behaviour.'
            },
            settings: {
                label: 'Settings',
                caption: 'The user can configure application options such as language, dark or light mode, and conversation mode. Currently available languages are: English, Swedish, and Hungarian. The user can also configure OpenAI API related parameters, such as API Key, model, max tokens, choices, and temperature. The OpenAI options are further explained in the settings dialog.'
            },
            history: {
                label: 'Conversation history',
                caption: 'Conversation history is supported in both basic and advanced modes. The user can view the conversation history, and delete conversations which are no longer needed. Titles are currently automatically generated, but may become editable in the future, if there is a user demand for it. The conversation history is stored locally.'
            },
            personas: {
                label: 'Personas',
                caption: 'A persona is in essence an AI bot with a specific configuration of expected competences and behaviours. The user can define and configure any number of personas. In basic mode one can be selected, and in advanced mode the user can select several to be included in a team.'
            },
            import: {
                label: 'Import prompts',
                caption: 'The user can import prompts from Awesome ChatGPT prompts. This GitHub repository holds a collection of prompt examples that other users have tested to be working with GPT models and chosen to open source. The user can use these prompts as inspiration to configure personas. These prompts are in English but can be translated to user desired languages using the application.'
            }
        },
        privacy: {
            title: 'Privacy',
            description: 'All user settings and provided information are stored locally in the application’s internal database. The application does not use cookies. The application does not use any tracking services. The application uses OpenAI APIs. Learn more about it here: https://platform.openai.com/docs/api-reference.'
        },
        license: {
            title: 'License',
            description: 'The application is licensed under the MIT license. The source code is available on GitHub: https://github.com/PeterBlenessy/TeamAI.'
        },
        contact: {
            title: 'Contact',
            description: 'The application is developed by Péter Blénessy. GitHub profile: https://github.com/PeterBlenessy.'
        }
    },
    history: {
        title: 'Conversations',
        description: 'The conversations are grouped by age, with the most recent conversation first. Your conversations are stored locally.',
        tooltip: {
            show: 'Show conversation',
            delete: 'Delete'
        },
        groups: {
            'Today': 'Today',
            'Yesterday': 'Yesterday',
            'ThisWeek': 'This week',
            'LastWeek': 'Last week',
            'ThisMonth': 'This month',
            'LastMonth': 'Last month',
            'Older': 'Older',
            'January': 'January',
            'February': 'February',
            'March': 'March',
            'April': 'April',
            'May': 'May',
            'June': 'June',
            'July': 'July',
            'August': 'August',
            'September': 'September',
            'October': 'October',
            'November': 'November',
            'December': 'December'
        }
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