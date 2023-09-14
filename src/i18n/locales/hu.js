export default {
    general: {
        failed: 'Sikertelen művelet',
        success: 'Sikeres művelet'
    },

    locale: {
        en: 'Angol',
        sv: 'Svéd',
        hu: 'Magyar'
    },

    userInput: {
        placeholder: {
            text: 'Kérdezz bátran',
            image: 'Írd le a képet amit generálni akarsz'
        },
        tooltip: {
            send: 'Küld',
            generateText: 'Szöveg generálás',
            generateImage: 'Kép generálás',
            speechStart: 'Diktálás indítása',
            speechStop: 'Leállítás',
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
            history: 'Korábbi beszélgetések',
            checkForUpdates: 'Frissítések ellenőrzése...',
        },
    },
    
    settings: {
        title: 'Beállítások',
        avatar: {
            label: 'Profilkép',
            caption: 'Válaszd ki a profilképedet',
            tooltip: 'Válaszd ki a profilképedet'
        },
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
        speech: {
            label: 'Beszéd nyelv',
            caption: 'Válszd ki a beszéd nyelvét',
            tooltip: 'Válszd ki a beszéd nyelvét'
        },
        conversationMode: {
            label: 'Beszélgetés mód',
            caption: 'Egyéni üzenetek vagy teljes beszélgetéstörténet küldése',
            tooltip: 'Beszélgetés mód ki/be kapcsolása'
        },
        appMode: {
            label: 'Alkalmazás mód',
            caption: 'Használja az alkalmazást alap vagy haladó módban',
            tooltip: 'Alkalmazás alap/haladó mód váltása'
        },
        chatDirection: {
            label: 'Beszélgetés megjelenítésének iránya',
            caption: 'Beszélgetés üzeneteinek megjelenítésének irányváltása fel/le',
            tooltip: 'Beszélgetés üzeneteinek megjelenítésének irányváltása fel/le'
        },
        quickSettings: {
            label: 'Gyors beállítások',
            caption: 'Gyors beállítások megjelenítése/elrejtése a chat ablakban',
            tooltip: 'Gyors beállítások megjelenítése/elrejtése'
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
            temperature: {
                label: 'Hőmérséklet',
                tooltip: 'A hőmérséklet a szövegben található véletlenszerűség mértéke. Az alacsonyabb értékek előrejelezhetőbb szöveget eredményeznek, míg a magasabb értékek meglepőbb szöveget eredményeznek.'
            },
            choices: {
                label: 'Képek száma',
                tooltip: 'Generálandó képek száma.'
            },
            size: {
                label: 'Kép mérete',
                tooltip: 'A kép mérete.'
            }
        },
        persona: {
            label: 'Personas',
            caption: 'Válaszd ki az AI asszisztens personáit',
            tooltip: 'Válaszd ki az AI asszisztens personáit'
        },
    },

    page: {},

    messages: {
        tooltip: {
            copy: 'Másol',
            delete: 'Töröl',
            share: 'Megoszt',
            info: 'Információ',
            speak: 'Olvasd fel a szöveget',
            stop: 'Hagyd abba a felolvasást'

        },
        info: {
            title: 'Üzenet információk',
            settings: 'Beállítások',
            systemMessages: 'Rendszer üzenetek',
            timestamp: 'Időbélyeg',
            usage: 'Token használat'
        }
    },

    info: {
        title: 'Alkalmazás leírása',
        description: 'A TeamAI alkalmazás lehetővé teszi a felhasználó számára, hogy egy OpenAI által vezérelt botokból álló csapatot hozzon létre, amelyeknek egyedi képességei és személyiségei vannak. A botok csapatmunkában oldják meg a felhasználó által kért feladatot, így minden bot hozzájárul a saját képességeivel.',
        features: {
            title: 'Funkciók',
            description: 'A alkalmazás lehetővé teszi a felhasználó számára, hogy egy OpenAI által meghajtott botokból álló csapatot hozzon létre egyedi képességekkel és személyiséggel. A botok csapatmunkában oldják meg a felhasználó által kért feladatot, minden bot hozzájárulva a saját képességeivel.',
            basic: {
                label: 'Alap mód',
                caption: 'Az alap módjában az alkalmazás chat alkalmazásként szolgál, a felhasználó pedig egyetlen AI bottal tud beszélgetni. A botot az OpenAI hajtja, és a felhasználó konfigurálhatja őket, hogy konkrét képességekkel és viselkedéssel rendelkezzenek.'
            },
            advanced: {
                label: 'Haladó mód',
                caption: 'A haladó módban a felhasználó létrehozhat csapatokat több mesterséges intelligencia botból, minden botnak saját szerepe, képességei, viselkedése és célja van a csapatban. A felhasználó hozzárendelhet egy feladatot a csapatnak, amelyet az AI botok közös együttműködésével oldanak meg. Minden botot az OpenAI hajtja, és a felhasználó konfigurálhatja őket, hogy konkrét képességekkel és viselkedéssel rendelkezzenek.'
            },
            settings: {
                label: 'Beállítások',
                caption: 'A felhasználó beállíthatja az alkalmazás opcióit, például a nyelvet, a sötét vagy világos módot és a beszélgetési módot. Jelenleg elérhető nyelvek: angol, svéd és magyar. A felhasználó beállíthatja az OpenAI API-val kapcsolatos paramétereket is, például az API-kulcsot, a modellt, a maximális tokeneket, a választási lehetőségeket és a hőmérsékletet. Az OpenAI opciók további magyarázata megtalálható a beállítások párbeszédablakban.'
            },
            history: {
                label: 'Beszélgetési előzmények',
                caption: 'A beszélgetési előzmények támogatottak úgy az alap, mind a haladó módban. A felhasználó megtekintheti a beszélgetési előzményeket és törölheti azokat, amelyek már nem szükségesek. A címek jelenleg automatikusan generálódnak, de a jövőben szerkeszthetővé válhatnak, ha erre igény van a felhasználók részéről. A beszélgetési előzmények helyileg tárolódnak.'
            },
            personas: {
                label: 'Personák',
                caption: 'A persona lényegében egy AI bot, amelynek meghatározott konfigurációja van az elvárt képességek és viselkedések terén. A felhasználó meghatározhat és konfigurálhat tetszőleges számú personát. Az alap mód kiválaszthat egyet, míg az előrehaladott módban a felhasználó többet is kiválaszthat egy csapatba.'
            },
            import: {
                label: 'Példák importálása',
                caption: 'A felhasználó importálhat példákat az Awesome ChatGPT példákból. Ez a GitHub tároló egy olyan gyűjteményt tartalmaz, amelyben más felhasználók által tesztelt és GPT modellekkel működőképesnek talált példák vannak, és nyílt forráskódúvá váltak. A felhasználó ezeket a példákat használhatja inspirációként a személyiségek konfigurálásához. Ezek a példák angol nyelven vannak, de a felhasználó kívánt nyelvre fordíthatja őket az alkalmazás segítségével.'
            }
        },
        privacy: {
            title: 'Adatvédelem',
            description: 'Az alkalmazás nem gyűjt személyes adatokat. Az alkalmazás nem használ cookie-kat. Az alkalmazás nem használ harmadik fél szolgáltatásait. Az alkalmazás nem használ analitikai szolgáltatásokat. Az alkalmazás nem használ követési szolgáltatásokat. Tudjon meg többet az OpenAI API-ról itt: https://platform.openai.com/docs/api-reference, és annak adatfelhasználási irányelveiről itt: https://openai.com/policies/api-data-usage-policies. Az alkalmazás szöveg-beszéd és beszéd-szöveg funkciókat kínál a Web Speech API-n keresztül. További információ a Web Speech API-ról itt: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API. Ha az operációs rendszer alapértelmezett böngészője a Chome, akkor a Chome Web Speech API implementációját fogja használni, és a Google szervereit fogja használni a beszéd-szöveg konverzióhoz. További információ erről a Google adatvédelmi célkitűzéseiben: https://www.google.com/chrome/privacy/whitepaper.html#speech.'
        },
        license: {
            title: 'Licenc',
            description: 'Az alkalmazás az MIT licenc alatt van licenszelve. A forráskód elérhető a GitHub-on: https://github.com/PeterBlenessy/TeamAI.'
        },
        contact: {
            title: 'Kapcsolat',
            description: 'Az alkalmazást Péter Blénessy fejleszti. GitHub profil: https://github.com/PeterBlenessy.'
        }
    },

    history: {
        title: "Beszélgetések",
        description: 'A beszélgetések régiség szerint vannak csoportosítva, a legújabb beszélgetés elől. A beszélgetések helyileg vannak tárolva.',
        tooltip: {
            show: 'Beszélgetés megjelenítése',
            copy: 'Beszélgetés vágólapra másolása',
            delete: 'Töröl',
            edit: 'Cím szerkesztése',
            save: 'Mentés',
            share: 'Megoszt'

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
                tooltip: 'Hozzáadás'
            },
            create: {
                label: 'Új persona létrehozása',
                caption: 'Hozz létre egy új personát, és határozd meg a kívánt képességeket és viselkedést.',
                tooltip: 'Új persona létrehozása'
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
            },
            save: {
                tooltip: 'Mentés'
            },
            search: {
                placeholder: 'Keresés...'
            }
       },
        tableHeading: {
            name: 'Név',
            prompt: 'Rendszerüzenet'
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
        },
        '503' : {
            message: 'A szerver jelenleg nem elérhető.',
            caption: 'Kérjük, próbálja újra rövid várakozás után.'
        },
        'Load': {
            message: 'Nem sikerült betölteni az erőforrást: A kérelem időtúllépése történt.',
            caption: 'Kérjük, próbálja újra rövid várakozás után.'
        },
        undefined: {
            message: 'Ismeretlen hiba történt.',
            caption: 'Kérjük, próbálja újra rövid várakozás után.'
        }
    }
}