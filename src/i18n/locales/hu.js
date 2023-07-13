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
            personas: 'Személyek',
            addTeam: 'Új csapat',
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
    history: {
        title: "Beszélgetések",
        description: 'A beszélgetések régiség szerint vannak csoportosítva, a legújabb beszélgetés elől. A beszélgetések helyileg vannak tárolva.',
        tooltip: {
            show: 'Beszélgetés megjelenítése',
            delete: 'Töröl'
        },
        groups: {
            'Today': 'Ma',
            'Yesterday': 'Tegnap',
            'ThisWeek': 'Ez a hét',
            'LastWeek': 'Múlt héten',
            'ThisMonth': 'Ez a hónap',
            'LastMonth': 'Múlt hónap',
            'Older': 'Régebbi',
            'January': 'Január',
            'February': 'Február',
            'March': 'Március',
            'April': 'Április',
            'May': 'Május',
            'June': 'Június',
            'July': 'Július',
            'August': 'Augusztus',
            'September': 'Szeptember',
            'October': 'Október',
            'November': 'November',
            'December': 'December'
        }
    },
    prompts: {
        generateTitle: 'Generálj egy címet ehhez a beszélgetéshez.'
    },
    personas: {
        title: 'Personák',
        description: 'A personák olyan AI asszisztensek, amelyeket konfigurálhatunk a kívánt képességek és viselkedés beállításával. A konfiguráció különlegesen kidolgozott rendszerüzenetek használatával érhető el. A rendszerüzeneteket az AI asszisztensnek a felhasználó üzenete előtt kell elküldeni.',
        actions: {
            add: {
                label: 'Új persona hozzáadása',
                caption: 'Adj hozzá egy új personát, és határozd meg a kívánt képességeket és viselkedést.',
                tooltip: 'Új persona hozzáadása'
            },
            import: {
                label: 'Personák importálása',
                caption: 'Importálj personákat az Awesome ChatGPT promptokból. Ez a GitHub tároló egy gyűjteményt tartalmaz olyan prompt példákból, amelyeket GPT modellekkel használhatsz. Ezek a promptok angol nyelven vannak.',
                tooltip: 'Personák importálása az Awesome ChatGPT promptokból'
            },
            edit: {
                tooltip: 'Szerkesztés'
            },
            delete: {
                tooltip: 'Törlés'
            }
        },
        tableHeading: {
            name: 'Név',
            prompt: 'Rendszerüzenet'
        }
    }
}