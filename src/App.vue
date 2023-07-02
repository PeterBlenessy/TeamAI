<template>
    <q-layout view="lHh lpr fFf">

        <q-header :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
            <q-toolbar>
                <OpenAI />
                <UserInput />

                <q-space />

                <q-btn @click="clearMessages" dense flat icon="mdi-notification-clear-all" :color="iconColor">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ $t('toolbar.tooltip.clear') }}
                    </q-tooltip>
                </q-btn>
                <q-btn @click="() => { showHistory = true }" dense flat icon="mdi-history" :color="iconColor">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ $t('toolbar.tooltip.history') }}
                    </q-tooltip>
                </q-btn>
                <q-btn dense flat icon="mdi-account-multiple-plus-outline" :color="iconColor">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.addTeam') }}
                    </q-tooltip>
                </q-btn>
                <q-btn dense flat icon="mdi-tune" @click="() => { showSettings = true }" :color="iconColor">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.settings') }}
                    </q-tooltip>
                </q-btn>

                <q-btn dense flat icon="mdi-information-outline" @click="() => { showInformation = true }" :color="iconColor">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.info') }}
                    </q-tooltip>
                </q-btn>

                <q-dialog v-model="showSettings" position="top" transition-show="slide-down">
                    <Settings />
                </q-dialog>

                <q-dialog v-model="showInformation" position="top" transition-show="slide-down">
                    <Information />
                </q-dialog>

                <q-dialog v-model="showHistory" position="bottom" transition-show="slide-up">
                    <History />
                </q-dialog>
            </q-toolbar>
        </q-header>

        <q-page-container>
            <q-page>
                <Messages />
                <!-- place QPageScroller at end of page -->
                <q-page-scroller reverse position="bottom-right" :scroll-offset="20" :offset="[20, 20]">
                    <q-btn round dense icon="south" />
                </q-page-scroller>

            </q-page>
        </q-page-container>

    </q-layout>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue';
import Settings from "./components/Settings.vue";
import UserInput from "./components/UserInput.vue";
import Messages from "./components/Messages.vue";
import OpenAI from './components/OpenAI.vue';
import History from './components/History.vue';
import Information from './components/Information.vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from './stores/settings-store.js';
import { useTeamsStore } from './stores/teams-store.js';
import { invoke } from '@tauri-apps/api';

// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
export default {

    components: {
    Settings,
    UserInput,
    Messages,
    OpenAI,
    History,
    Information
},

    setup() {
        const { t, locale } = useI18n();
        const $q = useQuasar();
        const settingsStore = useSettingsStore()
        const { darkMode, userLocale } = storeToRefs(settingsStore);

        const teamsStore = useTeamsStore();
        const { clearMessages } = teamsStore;

        // Set application locale to the one selected by the user and stored in the settings store.
        onMounted(() => locale.value = userLocale.value);

        // Show the main window when all web content has loaded.
        // This fixes the issue of flickering when the app starts and is in darkMode.
        onMounted(() => invoke('show_main_window'));

        // Watch runtime changes to dark mode
        watch(darkMode, () => $q.dark.set(darkMode.value));

        // Watch runtime changes to locale
        watch(locale, () => userLocale.value = locale.value);
        watch(userLocale, () => locale.value = userLocale.value);

        return {
            showSettings: ref(false),
            showInformation: ref(false),
            showHistory: ref(false),
            t,
            darkMode,
            clearMessages,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>