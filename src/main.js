import { createApp } from "vue";
import App from "@/App.vue";

// Quasar stuff
import { Quasar, Dark, Dialog, Notify } from 'quasar';
import iconSet from 'quasar/icon-set/svg-mdi-v7';
import 'quasar/dist/quasar.css';

// Custom styles
import "./styles.css";

// Pinia stuff
import { createPinia } from 'pinia';
import { localForagePlugin } from '@/services/localforage';

// i18n stuff
import { createI18n } from 'vue-i18n';
import messages from '@/i18n';

// ---------------------------------------------------------------------------------------------
// Create the app
const app = createApp(App);

// ---------------------------------------------------------------------------------------------
// Make i18n available in the app
const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages,
});
app.use(i18n);

// ---------------------------------------------------------------------------------------------
// Make pinia available in the app
const pinia = createPinia();

// Make localForage available in pinia stores
pinia.use(localForagePlugin);

app.use(pinia);

// ---------------------------------------------------------------------------------------------
// Make Quasar available in the app
app.use(Quasar, {
    plugins: { Dark, Dialog, Notify }, // import Quasar plugins and add here
    config: {
        dark: 'auto',
        notify: {},
        brand: {
            primary: '#ff6f00',
            secondary: '#ff8000',
            accent: '#9C27B0',    
            // dark: '#333333',
            // 'dark-page': '#191919',
            positive: '#21BA45',
            negative: '#f44336',
            info: '#333333',
            warning: '#f2c037'
        }
    },
    iconSet: iconSet,

    /*
    config: {
      brand: {
        // primary: '#e46262',
        // ... or all other brand colors
      },
      notify: {...}, // default set of options for Notify Quasar plugin
      loading: {...}, // default set of options for Loading Quasar plugin
      loadingBar: { ... }, // settings for LoadingBar Quasar plugin
      // ..and many more (check Installation card on each Quasar component/directive/plugin)
    }
    */
});

// ---------------------------------------------------------------------------------------------
app.mount("#app");
