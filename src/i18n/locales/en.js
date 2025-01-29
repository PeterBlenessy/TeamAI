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
        label: "Press Shift (⇧) + Enter (↵) for new line",
        tooltip: {
            send: 'Send',
            stop: 'Stop',
            generating: 'Generating...',
            generateText: 'Generate text',
            generateImage: 'Generate images',
            speechStart: 'Start dictation',
            speechStop: 'Stop',
        },
    },
    toolbar: {
        tooltip: {
            showDrawer: 'Show menu',
            hideDrawer: 'Hide menu',
            newConversation: 'New conversation',
            personas: 'Show personas',
            addTeam: 'Add a new team',
            info: 'Info',
            settings: 'Show settings',
            history: 'Show conversations',
            checkForUpdates: 'Check for updates...',
            iCloudSync: 'Sync with iCloud'
        },
    },

    quickSettings: {
        copy: {
            tooltip: 'Copy'
        },
        share: {
            tooltip:'Share'
        },
        delete: {
            tooltip:'Delete'
        },
        info: {
            tooltip:'Info',
            title: 'Conversation info',
            usage: 'Total token usage'
        },
    },

    settings: {
        title: 'Settings',

        avatar: {
            label: 'Avatar',
            caption: 'Select a user avatar avatar',
            tooltip: 'Click to select a user avatar'
        },

        general: {
            label: 'General',
            tooltip: 'General settings',

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
            streamResponse: {
                label: 'Stream response',
                caption: 'Stream the response from the AI assistant',
                tooltip: 'Stream the response from the AI assistant as small chunks of text, as opposed to waiting for the entire response to be generated.'
            },        
        },

        provider: {
            label: 'API provider',
            description: 'Select the API provider to use for generation or create a new one.',
            caption: 'Select the API provider to use for generation',
            tooltip: 'Select the API provider to use for generation',

            new: {
                buttonLabel: 'Add new',
                label: 'Add new API provider',
                caption: 'Fill in the below information for the new API provider',
                tooltip: 'Create a new API provider'
            },
            edit: {
                buttonLabel: 'Edit',
                label: 'Edit the selected API provider',
                caption: 'Update the API provider information',
                tooltip: 'Edit the selected API provider'
            },
            delete: {
                buttonLabel: 'Delete',
                label: 'Delete API provider',
                caption: 'Delete the selected API provider',
                tooltip: 'Delete the selected API provider'
            },
            name: {
                label: 'Name',
                placeholder: 'The name of the API provider',
                tooltip: 'Select the API provider to use for generation'
            },
            baseUrl: {
                label: 'Base URL of the API',
                placeholder: 'The API providers URL',
                tooltip: 'The API provider URL'
            },
            apiType: {
                label: 'API type',
                caption: 'Only OpenAI-like APIs are supported right now',
                tooltip: 'Select the type of the API provider'
            },
            apiKey: {
                label: 'API key',
                placeholder: 'Secret API key',
                tooltip: 'Your secret API key.'
            },
            ollama: {
                tooltip: 'Configure & Restart Ollama'
            },
            model: {
                label: 'AI model',
                tooltip: 'Select the AI model to use'
            },
            manage: {
                buttonLabel: 'Manage',
                tooltip: 'Manage installed models'
            },
            models: {
                buttonLabel: 'Models',
                tooltip: 'Manage installed models'
            }
        },

        api: {
            label: 'API Provider',
            tooltip: 'API Provider settings',

            url: {
                label: 'Server address',
                placeholder: 'https://api.example.com:443',
                tooltip: 'The address of the server'
            },

        },

        text: {
            label: 'Text generation',
            tooltip: 'Text generation settings',

            model: {
                label: 'AI model',
                tooltip: 'The AI model to use for generating the response.'
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

            personas: {
                label: 'Personas',
                caption: 'Select the personas of the AI assistant',
                tooltip: 'Select the personas of the AI assistant'
            },
            teamWork: {
                label: 'Team work',
                caption: 'Activate team work',
                tooltip: 'Activate team work. When activated, your question will be sent to the first persona, the response will be sent to the next, and so on. When inactive, each persona will respond with an individual response to your question.',
            },

        },
    
        image: {
            label: 'Image generation',
            tooltip: 'Image generation settings',

            size: {
                label: 'Image size',
                tooltip: 'The size of the image to generate.'
            },
            quality: {
                label: 'Image quality',
                tooltip: 'The quality of the image to generate.'
            },
            style: {
                label: 'Image style',
                tooltip: 'The style of the image to generate.',
                vivid: 'Vivid',
                natural: 'Natural'
            }
        },

        advanced: {
            label: 'Advanced',
            tooltip: 'Advanced settings',

            logging: {
                label: 'Application Logging',
                caption: 'Configure application logging settings',
                enabled: {
                    label: 'Enable Logging',
                    caption: 'Write application logs to file',
                    tooltip: 'Enable or disable application logging'
                },
                level: {
                    label: 'Log Level',
                    caption: 'Set the minimum severity level for logging',
                    tooltip: 'Select the minimum log level to record',
                    levels: {
                        trace: 'Trace - Very detailed debugging',
                        debug: 'Debug - General debugging',
                        info: 'Info - Normal operations',
                        warn: 'Warning - Potential issues',
                        error: 'Error - Serious problems'
                    }
                },
                viewer: {
                    label: 'View Logs',
                    tooltip: 'Open log viewer',
                    title: 'Application Logs',
                    copy: 'Copy Logs',
                    clear: 'Clear Logs',
                    empty: 'No logs available'
                }
            }
        },

        cloud: {
            label: 'Cloud Sync',
            tooltip: 'Cloud sync settings',
            title: 'Cloud Sync',
            sync: {
                label: 'Enable Cloud Sync',
                caption: 'Sync your settings across devices',
                unavailable: 'Cloud sync is only available on macOS devices',
                tooltip: 'Enable or disable cloud synchronization'
            },
            provider: {
                label: 'Cloud Provider',
                caption: 'Select your cloud storage provider',
                hint: 'Select your cloud storage provider',
                unavailable: 'Cloud providers are only available on macOS',
                tooltip: 'Choose which cloud service to use for syncing'
            },
            lastSync: {
                label: 'Last Sync',
                caption: 'Last synced: {date}'
            },
            enableDialog: {
                title: 'Cloud Sync Disabled',
                message: 'Cloud sync is currently disabled. Would you like to enable it in settings?',
                ok: 'Open Settings',
                cancel: 'Cancel'
            },
            options: {
                label: 'Sync Options',
                caption: 'Choose what to sync across your devices',
                tooltip: 'Configure which items to synchronize between your devices',
                personas: {
                    label: 'AI Personas',
                    caption: 'Keep your personas in sync across devices',
                    tooltip: 'Enable to sync your AI personas between devices'
                },
                conversations: {
                    label: 'Chat History',
                    caption: 'Keep your chat history in sync',
                    tooltip: 'Enable to sync conversation history between devices'
                },
                images: {
                    label: 'Generated Images',
                    caption: 'Keep your AI generated images in sync',
                    tooltip: 'Enable to sync AI generated images between devices'
                }
            },
            syncNow: 'Sync now'
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
        description: 'The TeamAI application allows the user to create a team of AI powered bots with individual capabilities, personas. The bots will solve the task requested by the user as a team effort, each bot contributing with its respective capabilities.',
        features: {
            title: 'Features',
            description: 'The application allows the user to create a team of AI powered bots with individual capabilities, personas. The bots will solve the task requested by the user as a team effort, each bot contributing with its respective capabilities.',
            basic: {
                label: 'Basic mode',
                caption: 'In its basic mode, the application serves as a chat application, with the user being able to chat with a single AI bot. The bot is powered by AI and can be configured by the user to have specific capabilities and behaviour.'
            },
            advanced: {
                label: 'Advanced mode',
                caption: 'In advanced mode, the user can create teams of several AI bots, each bot with a specific role, competences, behaviour and objective in the team. The user can assign a task to the team which will be solved in collaboration between the AI bots. Each bot is powered by AI and can be configured by the user to have specific capabilities and behaviour.'
            },
            settings: {
                label: 'Settings',
                caption: 'The user can configure application options such as language, dark or light mode, and conversation mode. Currently available languages are: English, Swedish, and Hungarian. The user can also configure AI Provider related parameters, such as API Key, model, max tokens, choices, and temperature. The AI Provider options are further explained in the settings dialog.'
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
            description: 'All user settings and provided information are stored locally in the application’s internal database. The application does not use cookies. The application does not use any tracking services. When configured so, the application uses OpenAI APIs. Learn more about the OpenAI API here: https://platform.openai.com/docs/api-reference, and about it’s data usage policies here: https://openai.com/policies/api-data-usage-policies. The application offers text-to-speech and speech-to-text functionality through the Web Speech API. Learn more about the Web Speech API here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API. If the default webview on the host operating system is Chome, it will use Chome´s implementation of the Web Speech API and will use Google´s servers to perform speech-to-text conversion. Read more about this in Google´s privacy whitepaper: https://www.google.com/chrome/privacy/whitepaper.html#speech.'
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
            'December': 'December',

            'Orphaned': 'Orphaned messages'
        }
    },
    prompts: {
        generateTitle: 'Generate a title for this conversation. Keep it short and concise. Do not use markup, emojis, or special characters. Use just plain text.',
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
            caption: 'Please ensure that the AI Provider API key used is correct.'
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
        'AbortError:': {
            message: 'The request was aborted.',
            caption: ''
        },
        'Request': {},
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
            title: 'Update available',
            caption: 'Would you like to download and install the update?',
            actions: {
                install: 'Download and install',
                dismiss: 'Dismiss'
            }
        },
        downloading: {
            title: 'Downloading Update',
            caption: 'Please wait while the update is being downloaded...'
        },
        relaunch: {
            title: 'New version downloaded',
            caption: 'Would you like to relaunch the application now?',
            actions: {
                relaunch: 'Relaunch',
                dismiss: 'Dismiss'
            }
        },
        relaunchDismiss: {
            message: 'Update installed',
            caption: 'The new version will be available after the next restart'
        },
        done: {
            message: 'Update downloaded.',
            caption: ''
        },
        releaseNotes: {
            message: 'Release Notes',
            caption: 'Changes in this version:'
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
            caption: 'All done. Database version is now  {version}.',
            action: 'Dismiss'
        },
        error: {
            message: 'Database upgrade error',
            action: 'Dismiss'
        }
    },
    icloud: {
        sync: {
            checking: {
                message: 'Checking for updates...'
            },
            inProgress: {
                message: 'Syncing settings...'
            },
            noChanges: {
                message: 'No changes to sync'
            },
            success: {
                message: 'Sync completed'
            },
            error: {
                message: 'Sync failed',
                caption: 'Unable to sync with iCloud'
            },
            conflict: {
                title: 'Sync Conflict Detected',
                subtitle: 'Choose which version to keep for each conflict',
                choose: 'Choose which version to keep:',
                local: 'Local Version',
                remote: 'Remote Version',
                useLocal: 'Use Local',
                useRemote: 'Use Remote',
                resolved: 'Conflict resolved'
            },
            status: {
                processing: 'Processing sync operations...',
                offline: 'Working offline',
                pendingChanges: 'Changes pending sync',
                retrying: 'Retrying sync...',
                error: 'Sync error occurred'
            },
            settings: {
                found: {
                    title: 'Newer Settings Found',
                    message: 'Newer settings were found in iCloud. Would you like to sync them now?'
                },
                loaded: {
                    message: 'Settings updated from iCloud'
                },
                actions: {
                    sync: 'Sync Now',
                    skip: 'Skip'
                },
                synced: {
                    message: 'Settings uploaded to iCloud'
                },
                error: {
                    message: 'Failed to sync settings'
                }
            },
            personas: {
                found: {
                    title: 'Newer Personas Found',
                    message: 'Newer personas were found in iCloud. Would you like to sync them now?'
                },
                loaded: {
                    message: 'Personas updated from iCloud'
                },
                actions: {
                    sync: 'Sync Now',
                    skip: 'Skip'
                },
                synced: {
                    message: 'Personas uploaded to iCloud'
                },
                error: {
                    message: 'Failed to sync personas'
                }
            },
            conversations: {
                found: {
                    title: 'Newer Conversations Found',
                    message: 'Newer conversations were found in iCloud. Would you like to sync them now?'
                },
                loaded: {
                    message: 'Conversations updated from iCloud'
                },
                actions: {
                    sync: 'Sync Now',
                    skip: 'Skip'
                },
                synced: {
                    message: 'Conversations uploaded to iCloud'
                },
                error: {
                    message: 'Failed to sync conversations'
                }
            },
            images: {
            inProgress: {
                message: 'Syncing with iCloud...'
            },
                found: {
                    title: 'Newer Images Found',
                    message: 'Newer images were found in iCloud. Would you like to sync them now?'
                },
                loaded: {
                    message: 'Images updated from iCloud'
                },
                actions: {
                    sync: 'Sync Now',
                    skip: 'Skip'
                },
                synced: {
                    message: 'Images uploaded to iCloud'
                },
                error: {
                    message: 'Failed to sync images'
                }
            }
        }
    }
}
