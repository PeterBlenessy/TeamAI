export default {
    general: {
    failed: 'Sikertelen művelet',
    success: 'Sikeres művelet'
    },
    
    userInput: {
        placeholder: 'Kérdezz bátran',
        tooltip: {
            send: 'Kérdés küldése',
        },
    },
    
    toolbar: {
        tooltip: {
            newConversation: 'Új beszélgetés',
            clear: 'Üzenetek törlése',
            addTeam: 'Új csapat hozzáadása',
            info: 'Információ',
            settings: 'Beállítások',
            history: 'Korábbi beszélgetések'
        },
    },
    settings: {
        darkMode: {
            label: 'Sötét mód',
            caption: 'Sötét/auto/világos mód váltása',
            tooltip: 'Sötét/auto/világos mód váltása'
        },
        locale: {
            label: 'Alkalmazás nyelv',
            caption: 'Válaszd ki az alkalmazás nyelvét',
            tooltip: 'Válaszd ki az alkalmazás nyelvét'
        },
        conversationMode: {
            label: 'Beszélgetés mód',
            caption: 'Egyéni üzenetek vagy teljes beszélgetéstörténet küldése',
            tooltip: 'Beszélgetés mód ki/be kapcsolása'
        },

        openAI: {
            apiKey: {
                label: 'OpenAI API kulcs',
                placeholder: 'Az OpenAI API kulcs',
                tooltip: 'Az OpenAI API kulcs. Az OpenAI dashboard-on található.'
            },
            model: {
                label: 'OpenAI modell',
                tooltip: 'Az OpenAI modell, amelyet a válasz generálásához használunk.'
            },
            maxTokens: {
                label: 'Maximális tokenek száma',
                tooltip: 'A válaszban található maximális tokenek száma.'
            },
            choices: {
                label: 'Választási lehetőségek',
                tooltip: 'Alternatív válaszok száma a kérdésre.'
            },
            temperature: {
                label: 'Hőmérséklet',
                tooltip: 'A hőmérséklet a szövegben található véletlenszerűség mértéke. Az alacsonyabb értékek előrejelezhetőbb szöveget eredményeznek, míg a magasabb értékek meglepőbb szöveget eredményeznek.'
            }
        }
    },
    
    apiErrors: {
        '401': {
            message: 'Érvénytelen hitelesítés.',
            caption: 'Győződjön meg arról, hogy az OpenAI API kulcsa helyes.'
        },
        '429': {
            message: 'A kérési arány korlátja elérte, vagy a motor túlterhelt lehet.',
            caption: 'Kérjük, próbálja újra rövid várakozás után.'
        },
        '500': {
            message: 'A szerver hibát észlelt a kérés feldolgozása során.',
            caption: 'Kérjük, próbálja újra rövid várakozás után, és lépjen velünk kapcsolatba, ha a probléma továbbra is fennáll.'
        },
        '400': {
            message: 'A kérés érvénytelennek tűnik.',
            caption: 'Ellenőrizze a kérését, majd próbálja újra.'
        }
    },
    
    page: {},
    
    info: {
        title: 'Információ',
        content: 'A TeamAI alkalmazás lehetővé teszi a felhasználó számára, hogy egy OpenAI által vezérelt botokból álló csapatot hozzon létre, amelyeknek egyedi képességei és személyiségei vannak. A botok csapatmunkában oldják meg a felhasználó által kért feladatot, így minden bot hozzájárul a saját képességeivel.'
    },
    history:{
        title: "Beszélgetések",
        delete: 'Töröl'
    },
    prompts: {
        generateTitle: 'Generálj egy címet ehhez a beszélgetéshez.'
    }
}