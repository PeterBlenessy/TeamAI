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
                                <q-icon dense flat :name="item.icon" :color="iconColor">
                                    <q-badge v-if="item.tooltip === 'toolbar.tooltip.checkForUpdates' && isUpdateAvailable" 
                                            floating rounded />
                                </q-icon>
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
                    <SettingsDialog 
                        v-model="showSettings" 
                        :initial-tab="settingsTab"
                    />
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
                    <q-btn round dense :icon="mdiArrowUp" color="primary" />
                </q-page-scroller>
                <q-page-scroller reverse position="bottom" :scroll-offset="50">
                    <q-btn round dense :icon="mdiArrowDown" color="primary" />
                </q-page-scroller>

            </q-page>

            <!-- Conditional placement of UserInput -->
            <q-footer v-show="chatDirection === 'up'" :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">

                <QuickSettings v-if="quickSettings == true" />
                <UserInput />
            </q-footer>

        </q-page-container>
        <Updater ref="updaterRef" />
    </q-layout>
</template>

<script setup>
import { computed, onBeforeMount, onMounted, ref, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings-store.js';
import { useTeamsStore } from '@/stores/teams-store.js';
import SettingsDialog from "@/components/Settings/SettingsDialog.vue";
import QuickSettings from "@/components/Settings/QuickSettings.vue";
import UserInput from "@/components/UserInput.vue";
import Messages from "@/components/Messages.vue";
import OpenAI from '@/components/OpenAI.vue';
import History from '@/components/History.vue';
import Information from '@/components/Information.vue';
import Personas from '@/components/Personas.vue';
import DatabaseUpgrader from '@/services/databaseUpgrader.js';
import logger from '@/services/logger';
import { useCloudSync } from '@/composables/useCloudSync';
import Updater from '@/components/Updater.vue';
import { 
    mdiMenu, mdiMenuOpen, mdiChatPlusOutline, mdiHistory, mdiCardAccountDetailsOutline, 
    mdiTune, mdiUpdate, mdiInformationOutline, mdiArrowUp, mdiArrowDown,
    mdiCloudSync
} from '@quasar/extras/mdi-v7';
import { useUpdater } from '@/composables/useUpdater';

const { t, locale } = useI18n();
const $q = useQuasar();
const settingsStore = useSettingsStore();
const { appMode, darkMode, quickSettings, userLocale, chatDirection, isDBUpgraded } = storeToRefs(settingsStore);

const teamsStore = useTeamsStore();
const { newConversation } = teamsStore;
const { syncToCloud } = useCloudSync();

const showSettings = ref(false);
const showInformation = ref(false);
const showHistory = ref(false);
const showPersonas = ref(false);
const settingsTab = ref('general');
const miniDrawer = ref(true);
const iconColor = computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8');

const dbUpgrader = DatabaseUpgrader();
const updaterRef = ref(null);
const { isUpdateAvailable, checkForUpdates } = useUpdater();
let updateInterval;

// Start periodic update checks
function startAutoCheck(intervalInMinutes = 60) {
    checkForUpdates(); // Initial check
    updateInterval = setInterval(checkForUpdates, intervalInMinutes * 60 * 1000);
}

// Stop periodic update checks
function stopAutoCheck() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
}

// Watch miniDrawer changes and update the toolbar icon
watch(miniDrawer, () => {
    toolbar.value[0].icon = miniDrawer.value === true ? mdiMenu : mdiMenuOpen;
    toolbar.value[0].tooltip = miniDrawer.value === true ? 'toolbar.tooltip.showDrawer' : 'toolbar.tooltip.hideDrawer';
});

const toolbar = ref([
    {
        action: () => { miniDrawer.value = !miniDrawer.value },
        icon: mdiMenu,
        tooltip: 'toolbar.tooltip.showDrawer',
        appMode: 'basic'
    },
    {
        action: newConversation,
        icon: mdiChatPlusOutline,
        tooltip: 'toolbar.tooltip.newConversation',
        appMode: 'basic'
    },
    {
        action: () => { showHistory.value = true },
        icon: mdiHistory,
        tooltip: 'toolbar.tooltip.history',
        appMode: 'basic'
    },
    {
        action: () => { showPersonas.value = true },
        icon: mdiCardAccountDetailsOutline,
        tooltip: 'toolbar.tooltip.personas',
        appMode: 'advanced'
    },
    {
        action: () => { showSettings.value = true },
        icon: mdiTune,
        tooltip: 'toolbar.tooltip.settings',
        appMode: 'basic'
    },
    {
        action: handleCheckForUpdates,
        icon: mdiUpdate,
        tooltip: 'toolbar.tooltip.checkForUpdates',
        appMode: 'advanced'
    },
    {
        action: () => { showInformation.value = true },
        icon: mdiInformationOutline,
        tooltip: 'toolbar.tooltip.info',
        appMode: 'basic'
    },
    {
        action: syncToCloud,
        icon: mdiCloudSync,
        tooltip: 'toolbar.tooltip.iCloudSync',
        appMode: 'advanced'
    }
]);

// Check if database upgrade is needed
onBeforeMount( async () => {
    isDBUpgraded.value = false;
    if (await dbUpgrader.isUpgradeNeed()) {
        dbUpgrader.upgrade();
    }
    isDBUpgraded.value = true;
});

// Set application locale to the one selected by the user and stored in the settings store.
onMounted(() => {
    locale.value = userLocale.value;
    startAutoCheck();
});

onUnmounted(() => {
    stopAutoCheck();
});

// Watch runtime changes to dark mode
watch(darkMode, () => $q.dark.set(darkMode.value));

// Watch runtime changes to locale
watch(locale, () => userLocale.value = locale.value);
watch(userLocale, () => locale.value = userLocale.value);

// Watch for update availability
watch(isUpdateAvailable, async (newValue) => {
    if (newValue) {
        await updaterRef.value?.checkForUpdates();
    }
});

// Check for updates
async function handleCheckForUpdates() {
    await updaterRef.value?.checkForUpdates();
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
