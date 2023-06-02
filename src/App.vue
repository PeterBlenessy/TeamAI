<template>
    <q-layout view="lHh lpr fFf">

        <q-header elevated >
            <q-toolbar>
                <UserInput />

                <q-space />

                <q-btn dense flat icon="group_add">
                    <q-tooltip delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.addTeam') }}
                    </q-tooltip>
                </q-btn>
                <q-btn dense flat icon="invert_colors" @click.stop="toggleDarkMode">
                    <q-tooltip delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.darkMode') }}
                    </q-tooltip>
                </q-btn>
                <q-btn dense flat icon="info">
                    <q-tooltip delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('toolbar.tooltip.info') }}
                    </q-tooltip>
                </q-btn>
            </q-toolbar>
        </q-header>

        <q-page-container>
            <q-page>

            </q-page>
        </q-page-container>

    </q-layout>
</template>

<script>
import { ref } from 'vue';
import UserInput from "./components/UserInput.vue"
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
export default {

    components: {
        UserInput,
    },

    setup() {
        const { t } = useI18n();
        const $q = useQuasar();
        
        return {
            t,
            toggleDarkMode: () => $q.dark.toggle()
        }
    },
}
</script>