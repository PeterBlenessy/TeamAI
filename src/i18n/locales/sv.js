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
            addTeam: 'Lägg till ett nytt team',
            info: 'Info',
            settings: 'Visa inställningar',
            history: 'Visa konversationer'

        },
    },
    settings: {
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
        title: 'Info',
        content: 'TeamAI-applikationen gör det möjligt för användaren att skapa ett team av OpenAI-drivna botar med individuella förmågor och personligheter. Botarna kommer att lösa uppgiften som efterfrågas av användaren som en teaminsats, där varje bot bidrar med sina respektive förmågor.'
    },
    history:{
        title: 'Konversationer',
        delete: 'Ta bort'
    },
    prompts: {
        generateTitle: 'Generera en titel för denna konversation.'
    }
}