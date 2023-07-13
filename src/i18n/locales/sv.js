// This is just an example,
// so you can safely delete all default props below

export default {
    general: {
        failed: 'Åtgärden misslyckades',
        success: 'Åtgärden lyckades'
    },

    userInput: {
        placeholder: 'Ställ din fråga',
        tooltip: {
            send: 'Skicka din fråga',
        },
    },

    toolbar: {
        tooltip: {
            newConversation: 'Ny konversation',
            clear: 'Rensa meddelanden',
            personas: 'Visa personas',
            addTeam: 'Lägg till ett nytt team',
            info: 'Info',
            settings: 'Visa inställningar',
            history: 'Visa konversationer'

        },
    },
    settings: {
        title: 'Inställningar',
        darkMode: {
            label: 'Mörkt läge',
            caption: 'Växla mellan mörkt/auto/ljust läge',
            tooltip: 'Växla mellan mörkt/auto/ljust läge'
        },
        locale: {
            label: 'Applikationsspråk',
            caption: 'Välj språk för applikationstext',
            tooltip: 'Välj språk för applikationstext'
        },
        conversationMode: {
            label: 'Konversationsläge',
            caption: 'Skicka individuella meddelanden eller hela konversationshistoriken',
            tooltip: 'Växla konversationsläge på/av'
        },

        openAI: {
            apiKey: {
                label: 'OpenAI API-nyckel',
                placeholder: 'Din OpenAI API-nyckel',
                tooltip: 'Din OpenAI API-nyckel. Du hittar den i din OpenAI-dashboard.'
            },
            model: {
                label: 'OpenAI-modell',
                tooltip: 'OpenAI-modell som ska användas för att generera svaret.'
            },
            maxTokens: {
                label: 'Maximalt antal tokens',
                tooltip: 'Det maximala antalet tokens i svaret.'
            },
            choices: {
                label: 'Val',
                tooltip: 'Antal svarsalternativ som ska genereras för varje fråga.'
            },
            temperature: {
                label: 'Temperatur',
                tooltip: 'Temperaturen är en mått på slumpmässigheten i texten. Lägre värden resulterar i mer förutsägbar text, medan högre värden resulterar i mer överraskande text.'
            }
        }
    },

    apiErrors: {
        '401': {
            message: 'Ogiltig autentisering.',
            caption: 'Se till att OpenAI API-nyckeln som används är korrekt.'
        },
        '429': {
            message: 'Begränsningen för antalet förfrågningar har nåtts, eller motorn kan vara överbelastad.',
            caption: 'Försök igen efter en kort väntan.'
        },
        '500': {
            message: 'Servern hade ett fel när den behandlade din förfrågan.',
            caption: 'Försök igen om en stund och kontakta oss om problemet kvarstår.'
        },
        '400': {
            message: 'Förfrågan verkar ogiltig.',
            caption: 'Kontrollera din förfrågan och försök igen.'
        }
    },

    page: {},

    info: {
        title: 'Applikationsbeskrivning',
        description: 'TeamAI-applikationen gör det möjligt för användaren att skapa ett team av OpenAI-drivna botar med individuella förmågor och personligheter. Botarna kommer att lösa uppgiften som efterfrågas av användaren som en teaminsats, där varje bot bidrar med sina respektive förmågor.',
        features: {
            title: 'Funktioner',
            description: 'Applikationen gör det möjligt för användaren att skapa ett team av OpenAI-drivna botar med individuella förmågor och personligheter. Botarna kommer att lösa den uppgift som användaren begär som ett team, där varje bot bidrar med sina respektive förmågor.',
            basic: {
                label: 'Grundläggande läge',
                caption: 'I sitt grundläggande läge fungerar applikationen som en chattapplikation, där användaren kan chatta med en enda AI-bot. Botten drivs av OpenAI och kan konfigureras av användaren för att ha specifika förmågor och beteenden.'
            },
            advanced: {
                label: 'Avancerat läge',
                caption: 'I avancerat läge kan användaren skapa team av flera AI-bots, där varje bot har en specifik roll, kompetens, beteende och mål i teamet. Användaren kan tilldela en uppgift till teamet som kommer att lösas i samarbete mellan AI-botsen. Varje bot drivs av OpenAI och kan konfigureras av användaren för att ha specifika förmågor och beteenden.'
            },
            settings: {
                label: 'Inställningar',
                caption: 'Användaren kan konfigurera applikationsalternativ som språk, mörkt eller ljust läge och konversationsläge. För närvarande tillgängliga språk är: Engelska, Svenska och Ungerska. Användaren kan också konfigurera OpenAI API-relaterade parametrar, som API-nyckel, modell, max antal tecken, val och temperatur. OpenAI-alternativen förklaras ytterligare i inställningsdialogen.'
            },
            history: {
                label: 'Konversationshistorik',
                caption: 'Konversationshistorik stöds både i grundläggande och avancerade lägen. Användaren kan visa konversationshistoriken och ta bort konversationer som inte längre behövs. Rubriker genereras för närvarande automatiskt, men kan i framtiden bli redigerbara om det finns efterfrågan från användarna. Konversationshistoriken lagras lokalt.'
            },
            personas: {
                label: 'Personas',
                caption: 'En persona är i grunden en AI-bot med en specifik konfiguration av förväntade kompetenser och beteenden. Användaren kan definiera och konfigurera valfritt antal personas. I grundläggande läge kan en persona väljas, och i avancerat läge kan användaren välja flera att inkludera i ett team.'
            },
            import: {
                label: 'Importera frågor',
                caption: 'Användaren kan importera frågor från Awesome ChatGPT-frågor. Denna GitHub-repositorium innehåller en samling exempel på frågor som andra användare har testat och fungerar med GPT-modeller och valt att öppna källkod. Användaren kan använda dessa frågor som inspiration för att konfigurera personas. Dessa frågor är på engelska men kan översättas till användarens önskade språk med hjälp av applikationen.'
            }
        },
        privacy: {
            title: 'Integritet',
            description: 'Alla inställningar som användaren gör och all information som anges lagras lokalt i applikationens interna databas. Applikationen använder inte cookies. Applikationen använder inte några spårningstjänster. Applikationen använder OpenAI API:er. Läs mer om det här: https://platform.openai.com/docs/api-reference.'
        },
        license: {
            title: 'Licens',
            description: 'Applikationen är licensierad under MIT-licensen. Källkoden finns tillgänglig på GitHub: https://github.com/PeterBlenessy/TeamAI.'
        },
        contact: {
            title: 'Kontakt',
            description: 'Applikationen utvecklas av Péter Blénessy. GitHub-profil: https://github.com/PeterBlenessy.'
        }
    },

    history: {
        title: 'Konversationer',
        description: 'Konversationerna är grupperade efter ålder, med den senaste konversationen först. Dina konversationer sparas lokalt.',
        tooltip: {
            show: 'Visa konversation',
            delete: 'Ta bort'
        },
        groups: {
            'Today': 'Idag',
            'Yesterday': 'Igår',
            'ThisWeek': 'Denna vecka',
            'LastWeek': 'Förra veckan',
            'ThisMonth': 'Denna månad',
            'LastMonth': 'Förra månaden',
            'Older': 'Äldre',
            'January': 'Januari',
            'February': 'Februari',
            'March': 'Mars',
            'April': 'April',
            'May': 'Maj',
            'June': 'Juni',
            'July': 'Juli',
            'August': 'Augusti',
            'September': 'September',
            'October': 'Oktober',
            'November': 'November',
            'December': 'December'
        }
    },
    prompts: {
        generateTitle: 'Generera en titel för denna konversation.'
    },
    personas: {
        title: 'Personas',
        description: 'Personas är AI-assistenter som konfigureras för att ha specifika förmågor och beteenden. Konfigurationen erhålls genom att använda speciellt utformade systemmeddelanden. Systemmeddelandena skickas till AI-assistenten före användarmeddelandet.',
        actions: {
            add: {
                label: 'Lägg till en ny persona',
                caption: 'Lägg till en ny persona och ange de önskade förmågorna och beteendet.',
                tooltip: 'Lägg till en ny persona'
            },
            import: {
                label: 'Importera personas',
                caption: 'Importera personas från Awesome ChatGPT prompts. Den här GitHub-repositoriet innehåller en samling exempel på meddelanden som kan användas med GPT-modeller. Dessa meddelanden är på engelska.',
                tooltip: 'Importera personas från Awesome ChatGPT prompts'
            },
            edit: {
                tooltip: 'Redigera'
            },
            delete: {
                tooltip: 'Ta bort'
            }
        },
        tableHeading: {
            name: 'Namn',
            prompt: 'Systemmeddelande'
        }
    }
}