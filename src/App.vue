<template>
    <q-layout view="lHh Lpr lfF">

        <!-- Conditional placement of UserInput -->
        <q-header v-show="chatDirection === 'down'" :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
            <q-toolbar>
                <UserInput />
            </q-toolbar>
        </q-header>

        <OpenAI />

        <!--  Left drawer -->
        <q-drawer :model-value="true" :mini="true" :persistent="true" bordered :breakpoint="600" side="left"
            :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
            <q-list padding>
                <div v-for="item in toolbar" :key="item.tooltip">
                    <div v-show="appMode === 'advanced' || item.appMode === appMode">

                        <q-item clickable v-ripple @click="item.action">
                            <q-item-section avatar>
                                <q-icon dense flat :name="item.icon" :color="iconColor" />
                            </q-item-section>
                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ $t(item.tooltip) }}
                            </q-tooltip>
                        </q-item>
                    </div>
                </div>
            </q-list>
        </q-drawer>

        <q-page-container>
            <q-page class="" id="page">
                <!-- Messages -->
                <Messages />

                <!-- Settings, Information, Personas, and History dialogs -->
                <q-dialog v-model="showSettings" position="top" transition-show="slide-down">
                    <Settings />
                </q-dialog>

                <q-dialog v-model="showInformation" position="top" transition-show="slide-down">
                    <Information />
                </q-dialog>

                <q-dialog v-model="showPersonas" position="top" transition-show="slide-down">
                    <Personas />
                </q-dialog>

                <q-dialog v-model="showHistory" position="bottom" transition-show="slide-up">
                    <History />
                </q-dialog>

                <!-- Top and bottom QPageScroller -->
                <q-page-scroller position="top" :scroll-offset="50">
                    <q-btn round dense icon="mdi-arrow-up" color="primary" />
                </q-page-scroller>
                <q-page-scroller reverse position="bottom" :scroll-offset="50">
                    <q-btn round dense icon="mdi-arrow-down" color="primary" />
                </q-page-scroller>

            </q-page>

            <!-- Conditional placement of UserInput -->
            <q-footer v-show="chatDirection === 'up'" :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
                <q-toolbar>
                    <UserInput />
                </q-toolbar>
            </q-footer>

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
import Personas from './components/Personas.vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from './stores/settings-store.js';
import { useTeamsStore } from './stores/teams-store.js';
import { invoke } from '@tauri-apps/api';
import { emit } from '@tauri-apps/api/event';

// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
export default {

    components: {
        Settings,
        UserInput,
        Messages,
        OpenAI,
        History,
        Information,
        Personas
    },

    setup() {
        const { t, locale } = useI18n();
        const $q = useQuasar();
        const settingsStore = useSettingsStore()
        const { appMode, darkMode, userLocale, chatDirection } = storeToRefs(settingsStore);

        const teamsStore = useTeamsStore();
        const { newConversation, conversationId } = teamsStore;

        const showSettings = ref(false);
        const showInformation = ref(false);
        const showHistory = ref(false);
        const showPersonas = ref(false);

        const toolbar = [
            {
                action: newConversation,
                icon: 'mdi-chat-plus-outline',
                tooltip: 'toolbar.tooltip.newConversation',
                appMode: 'basic'
            },
            {
                action: deleteMessages,
                icon: 'mdi-notification-clear-all',
                tooltip: 'toolbar.tooltip.clear',
                appMode: 'basic'
            },
            {
                action: () => { showHistory.value = true },
                icon: 'mdi-history',
                tooltip: 'toolbar.tooltip.history',
                appMode: 'basic'
            },
            {
                action: () => { showPersonas.value = true },
                icon: 'mdi-card-account-details-outline',
                tooltip: 'toolbar.tooltip.personas',
                appMode: 'advanced'
            },
            {
                action: () => { },
                icon: 'mdi-account-multiple-plus-outline',
                tooltip: 'toolbar.tooltip.addTeam',
                appMode: 'advanced'
            },
            {
                action: () => { showSettings.value = true },
                icon: 'mdi-tune',
                tooltip: 'toolbar.tooltip.settings',
                appMode: 'basic'
            },
            {
                action: () => checkForUpdates,
                icon: 'mdi-update',
                tooltip: 'toolbar.tooltip.checkForUpdates',
                appMode: 'advanced'
            },
            {
                action: () => { showInformation.value = true },
                icon: 'mdi-information-outline',
                tooltip: 'toolbar.tooltip.info',
                appMode: 'basic'
            }
        ];

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

        // Clear messages in current conversation.
        function deleteMessages() {
            teamsStore.deleteMessages(conversationId.value);
        }

        // Check for updates
        async function checkForUpdates() {
            await emit('tauri://update', {});
        }

        return {
            appMode,
            chatDirection,
            showSettings,
            showInformation,
            showHistory,
            showPersonas,
            toolbar,
            t,
            newConversation,
            checkForUpdates,
            deleteMessages,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>

<style>
/* Hide scrollbars on Macs (and WebKit based webviews) 
::-webkit-scrollbar {
    display: none;
}
/* Hide scrollbars on Windows (in IE and Edge)
body {
    overflow: auto;
    -ms-overflow-style: none;
}
/* Hide scrollbars in Firefox
html {
    scrollbar-width: none;
}
*/
</style>