<template>
    <q-list>

        <q-item-label overline>{{ $t('history.title') }}</q-item-label>
        <q-separator />
        
        <div v-for="item in history" :key="item.timestamp">
            <q-item top dense>
                <q-item-section avatar top>
                    <q-icon rounded size="md" name="mdi-chat" :color="iconColor" />
                </q-item-section>

                <q-item-section top>
                    <q-item-label>
                        {{ item.title }}
                    </q-item-label>
                </q-item-section>
            </q-item>
        </div>

    </q-list>
</template>

<script>

import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
    name: 'History',
    setup() {
        const teamsStore = useTeamsStore();
        const { history } = storeToRefs(teamsStore);
        const $q = useQuasar();
        const { t } = useI18n();

        return {
            t,
            history,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style>
</style>
