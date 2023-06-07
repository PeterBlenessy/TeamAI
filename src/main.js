import { createApp } from "vue";
import App from "./App.vue";

// Quasar stuff
import { Quasar, Dark, Notify } from 'quasar';
import quasarIconSet from 'quasar/icon-set/svg-material-icons'
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/dist/quasar.css';

// Custom styles
//import "./styles.css";

// Pinia stuff
import { createPinia } from 'pinia';

// i18n stuff
import { createI18n } from 'vue-i18n';
import messages from './i18n';

// Create the app
const app = createApp(App);

// Make pinia available in the app
const pinia = createPinia();
app.use(pinia);

// Make i18n available in the app
const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    messages,
});
app.use(i18n);

// Make Quasar available in the app
app.use(Quasar, {
    plugins: { Dark, Notify }, // import Quasar plugins and add here
    config: {
        dark: 'auto',
        notify: {}
    },
    iconSet: quasarIconSet,
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

app.mount("#app");
