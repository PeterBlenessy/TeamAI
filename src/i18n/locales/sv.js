// This is just an example,
// so you can safely delete all default props below

export default {
    general: {
        failed: 'Åtgärden misslyckades',
        success: 'Åtgärden lyckades'
    },

    locale: {
        en: 'Engelska',
        sv: 'Svenska',
        hu: 'Ungerska'
    },

    userInput: {
        placeholder: {
            text: 'Ställ din fråga',
            image: 'Beskriv bilden du vill generera'
        },
        tooltip: {
            send: 'Skicka din fråga',
            generateText: 'Generera text',
            generateImage: 'Generera bilder',
            speechStart: 'Starta diktering',
            speechStop: 'Stoppa',
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
            history: 'Visa konversationer',
            checkForUpdates: 'Kolla efter uppdateringar...'
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
        speech: {
            label: 'Talspråk',
            caption: 'Välj språk för tal-till-text och text-till-tal',
            tooltip: 'Välj språk för tal'
        },
        conversationMode: {
            label: 'Konversationsläge',
            caption: 'Skicka individuella meddelanden eller hela konversationshistoriken',
            tooltip: 'Växla konversationsläge på/av'
        },
        appMode: {
            label: 'Applikationsläge',
            caption: 'Använd applikationen i grundläge eller avancerat läge',
            tooltip: 'Växla mellan grundläge och avancerat läge för applikationen'
        },
        chatDirection: {
            label: 'Chattriktning',
            caption: 'Växla riktningen av chattmeddelandena upp/ner',
            tooltip: 'Växla riktningen av chattmeddelandena upp/ner'
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
            temperature: {
                label: 'Temperatur',
                tooltip: 'Temperaturen är en mått på slumpmässigheten i texten. Lägre värden resulterar i mer förutsägbar text, medan högre värden resulterar i mer överraskande text.'
            },
            choices: {
                label: 'Antal bilder',
                tooltip: 'Antal bilder att generera.'
            },
            size: {
                label: 'Bildstorlek',
                tooltip: 'Bildstorlek i pixlar.'
            }
        },
        persona: {
            label: 'Persona',
            caption: 'Välj AI assistentens persona.',
            tooltip: 'Välj AI assistentens persona.'
        },
    },

    page: {},

    messages: {
        tooltip: {
            copy: 'Kopiera',
            delete: 'Ta bort',
            share: 'Dela',
            info: 'Info',
            speak: 'Läs upp texten',
            stop: 'Sluta läsa upp texten'
        },
        info: {
            title: 'Meddelandeinfo',
            apiParameters: 'API-parametrar',
            conversationMode: 'Konversationsläge',
            systemMessages: 'Systemmeddelanden',
            timestamp: 'Tidsstämpel',
            usage: 'Token användning'
        }
    },

    info: {
        title: 'Applikationsbeskrivning',
        description: 'TeamAI-applikationen gör det möjligt för användaren att skapa ett team av OpenAI-drivna botar med individuella förmågor och personligheter. Botarna kommer att lösa uppgiften som efterfrågas av användaren som en teaminsats, där varje bot bidrar med sina respektive förmågor.',
        features: {
            title: 'Funktioner',
            description: 'Applikationen gör det möjligt för användaren att skapa ett team av OpenAI-drivna botar med individuella förmågor och personligheter. Botarna kommer att lösa den uppgift som användaren begär som ett team, där varje bot bidrar med sina respektive förmågor.',
            basic: {
                label: 'Grundläge',
                caption: 'I sitt grundläge fungerar applikationen som en chattapplikation, där användaren kan chatta med en enda AI-bot. Botten drivs av OpenAI och kan konfigureras av användaren för att ha specifika förmågor och beteenden.'
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
            description: 'Alla inställningar som användaren gör och all information som anges lagras lokalt i applikationens interna databas. Applikationen använder inte cookies. Applikationen använder inte några spårningstjänster. Applikationen använder OpenAI API:er. Lär dig mer om OpenAI API här: https://platform.openai.com/docs/api-reference, och om dess datahanteringspolicy här: https://openai.com/policies/api-data-usage-policies. Applikationen erbjuder text-till-tal och tal-till-text funktionalitet genom Web Speech API. Lär dig mer om Web Speech API här: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API. Om standardwebbvisningen på värdoperativsystemet är Chome, kommer den att använda Chomes implementering av Web Speech API och kommer att använda Googles servrar för att utföra tal-till-text konvertering. Läs mer om detta i Googles förtydligande om sekretess: https://www.google.com/chrome/privacy/whitepaper.html#speech.'
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
            copy: 'Kopiera konversationen till urklipp',
            delete: 'Ta bort',
            edit: 'Editera titeln',
            save: 'Spara',
            share: 'Dela',
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
                tooltip: 'Lägg till'
            },
            create: {
                label: 'Skapa en ny persona',
                caption: 'Skapa en ny persona och ange de önskade förmågorna och beteendet.',
                tooltip: 'Skapa en ny persona'
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
            },
            save: {
                tooltip: 'Spara'
            },
            search: {
                placeholder: 'Sök...'
            }
        },
        tableHeading: {
            name: 'Namn',
            prompt: 'Systemmeddelande'
        }
    },
    apiErrors: {
        '401': {
            message: 'Ogiltig autentisering.',
            caption: 'Se till att OpenAI API-nyckeln som används är korrekt.'
        },
        '429': {
            message: 'Begränsningen för antalet förfrågningar har nåtts, eller servern kan vara överbelastad.',
            caption: 'Försök igen om en stund.'
        },
        '500': {
            message: 'Servern hade ett fel när den behandlade ditt anrop.',
            caption: 'Försök igen om en stund och kontakta oss om problemet kvarstår.'
        },
        '400': {
            message: 'Anropet verkar ogiltig.',
            caption: 'Kontrollera ditt anrop och försök igen.'
        },
        '503' : {
            message: 'Servern är för närvarande otillgänglig.',
            caption: 'Försök igen om en stund.'
        },
        'Load': {
            message: 'Det gick inte att ladda resursen: Förfrågan tog för lång tid.',
            caption: 'Försök igen om en stund.'
        },
        undefined: {
            message: 'Ett okänt fel inträffade.',
            caption: 'Försök igen om en stund.'
        }
    }
}