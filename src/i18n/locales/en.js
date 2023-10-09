// This is just an example,
// so you can safely delete all default props below

export default {
    general: {
        failed: 'Action failed',
        success: 'Action was successful'
    },

    locale: {
        en: 'English',
        sv: 'Swedish',
        hu: 'Hungarian'
    },

    userInput: {
        placeholder: {
            text: 'Ask your question',
            image: 'Describe the image to generate'
        },
        tooltip: {
            send: 'Send',
            generateText: 'Generate text',
            generateImage: 'Generate images',
            speechStart: 'Start dictation',
            speechStop: 'Stop',
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
            history: 'Show conversations',
            checkForUpdates: 'Check for updates...',
        },
    },
    settings: {
        title: 'Settings',
        avatar: {
            label: 'Avatar',
            caption: 'Select a user avatar avatar',
            tooltip: 'Click to select a user avatar'
        },
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
        speech: {
            label: 'Speech language',
            caption: 'Select the prefered speech language',
            tooltip: 'Select the prefered speech language'
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
        quickSettings: {
            label: 'Quick settings',
            caption: 'Show quick settings in chat window',
            tooltip: 'Show quick settings'
        },

        teamWork: {
            label: 'Team work',
            caption: 'Activate team work',
            tooltip: 'Activate team work. When activated, your question will be sent to the first persona, the response will be sent to the next, and so on. When inactive, each persona will respond with an individual response to your question.',
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
            temperature: {
                label: 'Temperature',
                tooltip: 'Temperature is a measure of the randomness in the text. Lower values will result in more predictable text, while higher values will result in more surprising text.'
            },
            choices: {
                label: 'Number of images',
                tooltip: 'Number of images to generate.'
            },
            size: {
                label: 'Image size',
                tooltip: 'The size of the image to generate.'
            }
        },
        persona: {
            label: 'Personas',
            caption: 'Select the personas of the AI assistant',
            tooltip: 'Select the personas of the AI assistant'
        }
    },

    page: {},

    messages: {
        tooltip: {
            copy: 'Copy',
            delete: 'Delete',
            share: 'Share',
            info: 'Info',
            speak: 'Read text aloud',
            stop: 'Stop reading'
        },
        info: {
            title: 'Message info',
            settings: 'Settings',
            systemMessages: 'System messages',
            timestamp: 'Timestamp',
            usage: 'Token usage',
        }
    },

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
            description: 'All user settings and provided information are stored locally in the application’s internal database. The application does not use cookies. The application does not use any tracking services. The application uses OpenAI APIs. Learn more about the OpenAI API here: https://platform.openai.com/docs/api-reference, and about it’s data usage policies here: https://openai.com/policies/api-data-usage-policies. The application offers text-to-speech and speech-to-text functionality through the Web Speech API. Learn more about the Web Speech API here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API. If the default webview on the host operating system is Chome, it will use Chome´s implementation of the Web Speech API and will use Google´s servers to perform speech-to-text conversion. Read more about this in Google´s privacy whitepaper: https://www.google.com/chrome/privacy/whitepaper.html#speech.'
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
            copy: 'Copy conversation to clipboard',
            delete: 'Delete',
            edit: 'Edit title',
            save: 'Save',
            share: 'Share'
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
                tooltip: 'Add'
            },
            create: {
                label: 'Create a new persona',
                caption: 'Create a new persona and specify the abilities and behaviour you desire it to have.',
                tooltip: 'Create',
                name: 'New persona',
                prompt: 'You are a helpful assistant.'
            },
            import: {
                label: 'Import personas',
                caption: 'Import personas from Awesome ChatGPT prompts. This GitHub repository holds a collection of prompt examples that can be used with GPT models. These prompts are in English.',
                tooltip: 'Import personas from Awesome ChatGPT prompts',
            },
            example: {
                caption: 'Import example personas from TeamAI GitHub repository.',
                tooltip: 'Import example personas from TeamAI GitHub repository',
            },
            edit: {
                tooltip: 'Edit'
            },
            save: {
                tooltip: 'Save'
            },
            delete: {
                tooltip: 'Delete'
            },
            search: {
                placeholder: 'Search...'
            },
            avatar: {
                tooltip: 'Select avatar'
            }
        },
        tableHeading: {
            avatar: 'Avatar',
            name: 'Name',
            prompt: 'Description'
        }
    },

    apiErrors: {
        '400': {
            message: 'The request seams invalid.',
            caption: 'Please check your request and try again.'
        },
        '401': {
            message: 'Invalid Authentication.',
            caption: 'Please ensure that the OpenAI API key used is correct.'
        },
        '404': {
            message: 'The request seams invalid.',
            caption: 'Please check your request and try again.'
        },
        '429': {
            message: 'Rate limit reached for requests, or the engine may be overloaded.',
            caption: 'Please retry your requests after a brief wait.'
        },
        '500': {
            message: 'The server had an error while processing your request.',
            caption: 'Please retry your request after a brief wait and contact us if the issue persists.'
        },
        '503' : {
            message: 'The server is currently unavailable.',
            caption: 'Please try again later.'
        },
        'Load': {
            message: 'Failed to load resource: The request timed out.',
            caption: 'Please try again later.'
        },
        undefined: {
            message: 'An unknown error occurred.',
            caption: 'Please try again later.'
        }
    },
    updater: {
        pending: {
            message: 'Checking for updates...',
            caption: 'Please wait.'
        },
        error: {
            message: 'Error while checking for updates.',
            caption: 'Please try again later.'
        },
        upToDate: {
            message: 'No updates available.',
            caption: 'You are running the latest version.'
        },
        updateAvailable: {
            message: 'Update available.',
            caption: 'Would you like to download and install the update?',
            actions: {
                install: 'Download and install',
                later: 'Later'
            }
        },
        relaunch: {
            message: 'New version downloaded.',
            caption: 'Would you like to relaunch the application now to use the new version?',
            actions: {
                relaunch: 'Relaunch',
                later: 'Later'
            }
        },

        done: {
            message: 'Update downloaded.',
            caption: ''
        },
    },
    databaseUpgrade: {
        needed: {
            message: 'Database upgrade needed',
            caption: 'Please wait.'
        },
        inProgress: {
            caption: 'Upgrading database to version {version}...'
        },
        completed: {
            message: 'Database upgrade completed',
            caption: 'All done.',
            action: 'Dismiss'
        },
        error: {
            message: 'Database upgrade error',
            action: 'Dismiss'
        }
    }
}