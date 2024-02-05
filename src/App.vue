<template>
    <q-layout view="lHh Lpr lfF">

        <!-- Conditional placement of UserInput -->
        <q-header v-show="chatDirection === 'down'" :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
            <UserInput />
            <QuickSettings v-if="quickSettings == true" />
        </q-header>

        <OpenAI />

        <!--  Left drawer -->
        <q-drawer :model-value="true" :mini="miniDrawer" :width="250" :persistent="true" bordered :breakpoint="600"
            side="left" :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
            <q-list padding>
                <div v-for="item in toolbar" :key="item.tooltip">
                    <div v-show="appMode === 'advanced' || item.appMode === appMode">

                        <q-item clickable v-ripple @click="item.action">
                            <q-item-section avatar>
                                <q-icon dense flat :name="item.icon" :color="iconColor" />
                                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                    {{ $t(item.tooltip) }}
                                </q-tooltip>
                            </q-item-section>
                            <q-item-section no-wrap
                                v-if="item.tooltip != 'toolbar.tooltip.showDrawer' && item.tooltip != 'toolbar.tooltip.hideDrawer'">
                                {{ $t(item.tooltip) }}
                            </q-item-section>
                        </q-item>
                    </div>
                </div>
            </q-list>
        </q-drawer>

        <q-page-container>
            <q-page class="" id="page">

                <!-- Messages -->
                <Messages v-if="isDBUpgraded == true" />

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

                <QuickSettings v-if="quickSettings == true" />
                <UserInput />
            </q-footer>

        </q-page-container>
    </q-layout>
</template>

<script>
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue';
import Settings from "./components/Settings.vue";
import QuickSettings from "./components/QuickSettings.vue";
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
import { checkUpdate, onUpdaterEvent } from '@tauri-apps/api/updater'
import DatabaseUpgrader from './services/databaseUpgrader.js';
import logger from './services/logger';

// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
export default {

    components: {
        Settings,
        QuickSettings,
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
        const { appMode, darkMode, quickSettings, userLocale, chatDirection, isDBUpgraded } = storeToRefs(settingsStore);

        const teamsStore = useTeamsStore();
        const { newConversation } = teamsStore;

        const showSettings = ref(false);
        const showInformation = ref(false);
        const showHistory = ref(false);
        const showPersonas = ref(false);

        const dbUpgrader = DatabaseUpgrader();

        const miniDrawer = ref(true);

        // Watch miniDrawer changes and update the toolbar icon
        watch(miniDrawer, () => {
            toolbar.value[0].icon = miniDrawer.value === true ? 'mdi-menu' : 'mdi-menu-open'
            toolbar.value[0].tooltip = miniDrawer.value === true ? 'toolbar.tooltip.showDrawer' : 'toolbar.tooltip.hideDrawer'
        });

        const toolbar = ref([
            {
                action: () => { miniDrawer.value = !miniDrawer.value },
                icon: 'mdi-menu',
                tooltip: 'toolbar.tooltip.showDrawer',
                appMode: 'basic'
            },
            {
                action: newConversation,
                icon: 'mdi-chat-plus-outline',
                tooltip: 'toolbar.tooltip.newConversation',
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
                action: () => { showSettings.value = true },
                icon: 'mdi-tune',
                tooltip: 'toolbar.tooltip.settings',
                appMode: 'basic'
            },
            {
                action: checkForUpdates,
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
        ]);


        // Check if database upgrade is needed
        onBeforeMount(() => {
            isDBUpgraded.value = false;
        });

        onMounted(async () => {
            if (await dbUpgrader.isUpgradeNeed()) {
                dbUpgrader.upgrade();
            }
            isDBUpgraded.value = true;
        });

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

        // Check for updates
        async function checkForUpdates() {

            // Listen to updater events
            const unlisten = await onUpdaterEvent(({ error, status }) => {
                // This will log all updater events, including status updates and errors.
                logger.log('Updater event', error, status)

                let updater = {
                    'PENDING': { icon: 'mdi-information', type: 'info', message: t('updater.pending.message'), caption: t('updater.pending.caption') },
                    'ERROR': { icon: 'mdi-alert', type: 'negative', message: t('updater.error.message'), caption: t('updater.error.caption') },
                    'DONE': { icon: 'mdi-check', type: 'positive', message: t('updater.done.message'), caption: t('updater.done.caption') },
                    'UPTODATE': { icon: 'mdi-check', type: 'positive', message: t('updater.upToDate.message'), caption: t('updater.upToDate.caption') }
                };

                $q.notify({
                    position: 'top',
                    icon: updater[status].icon,
                    type: updater[status].type,
                    spinner: false,
                    message: updater[status].message,
                    caption: updater[status].caption,
                    timeout: 2000
                });
            });


            try {
                // checkUpdate() displays Tauri update flow if an update is available.
                // When no update is available, onUpdaterEvent() will be triggered and frontend notifications used.
                const { shouldUpdate, manifest } = await checkUpdate();

                if (shouldUpdate) {
                    logger.log(`Update available ${manifest?.version}, ${manifest?.date}, ${manifest?.body}`);
                    // Uncomment to enable frontend install/relaunch flow.
                    // Also, disable the built-in Tauri dialog in Tauri config.

                    // Install the update. This will also restart the app on Windows!
                    // notification({
                    //     multiline: true,
                    //     message: t('updater.updateAvailable.message'),
                    //     caption: t('updater.updateAvailable.caption') + updateInfo,
                    //     actions: [
                    //         { label: t('updater.updateAvailable.actions.install'), color: 'white', handler: async () => { await installUpdate(); } },
                    //         { label: t('updater.updateAvailable..actions.later'), color: 'white', handler: () => { } }
                    //     ],
                    // });

                    // On macOS and Linux you will need to restart the app manually.
                    // notification({
                    //     message: t('updater.relaunch.message'),
                    //     caption: t('updater.relaunch.caption'),
                    //     actions: [
                    //         { label: t('updater.relaunch.actions.relaunch'), color: 'white', handler: async () => { await relaunch(); } },
                    //         { label: t('updater.relaunch.actions.later'), color: 'white', handler: () => { } }
                    //     ],
                    // });
                }
            } catch (error) {
                logger.error(error);
            }

            // you need to call unlisten if your handler goes out of scope, for example if the component is unmounted.
            unlisten();
        }

        return {
            appMode,
            miniDrawer,
            chatDirection,
            showSettings,
            showInformation,
            showHistory,
            showPersonas,
            quickSettings,
            toolbar,
            t,
            newConversation,
            checkForUpdates,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8'),
            isDBUpgraded
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