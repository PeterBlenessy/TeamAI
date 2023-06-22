<template>
    <q-layout view="lHh lpr fFf">

        <q-header class="bg-grey-10">
            <q-toolbar>
                <OpenAI />
                <UserInput />

                <q-space />

                <q-btn dense flat icon="group_add">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.addTeam') }}
                    </q-tooltip>
                </q-btn>
                <q-btn dense flat icon="tune" @click="() => { showSettings = true }">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.settings') }}
                    </q-tooltip>
                </q-btn>

                <q-btn dense flat icon="info" @click="">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.info') }}
                    </q-tooltip>
                </q-btn>

                <q-dialog v-model="showSettings" position="top" transition-show="slide-down">
                    <AppSettings />
                </q-dialog>

            </q-toolbar>
        </q-header>

        <q-page-container>
            <q-page>
                <Messages />
            </q-page>
        </q-page-container>

    </q-layout>
</template>

<script>
import { onMounted, ref, watch } from 'vue';
import AppSettings from "./components/AppSettings.vue";
import UserInput from "./components/UserInput.vue";
import Messages from "./components/Messages.vue";
import OpenAI from './components/OpenAI.vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from './stores/settings-store.js';
import { invoke } from '@tauri-apps/api';

// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
export default {

    components: {
        AppSettings,
        UserInput,
        Messages,
        OpenAI
    },

    setup() {
        const { t } = useI18n();
        const $q = useQuasar();
        const settingsStore = useSettingsStore()
        const { darkMode } = storeToRefs(settingsStore);

        // Show the main window when all web content has loaded.
        // This fixes the issue of flickering when the app starts and is in darkMode.
        onMounted(() => invoke('show_main_window'));

        // Watch runtime changes to dark mode
        watch(darkMode, () => $q.dark.set(darkMode.value));

        return {
            showSettings: ref(false),
            t,
            darkMode,
        }
    },
}
</script>