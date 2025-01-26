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
// Resize handler to suppress only ResizeObserver errors while preserving other logging
const resizeHandler = () => {
  // Track if we've already logged ResizeObserver errors to prevent spam
  let hasLoggedResizeError = false;

  // Only filter ResizeObserver console errors, preserve all other error logging
  const originalError = window.console.error;
  window.console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
      // Only log the first occurrence of ResizeObserver errors
      if (!hasLoggedResizeError) {
        originalError.apply(console, ['ResizeObserver errors suppressed to reduce noise']);
        hasLoggedResizeError = true;
      }
      return;
    }
    originalError.apply(console, args);
  };

  // Handle ResizeObserver window errors
  window.addEventListener('error', (e) => {
    if (e.message.includes('ResizeObserver')) {
      e.stopImmediatePropagation();
      return false;
    }
  }, true);
};

resizeHandler();

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
