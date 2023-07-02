<template>
    <q-card>
        <q-list>

            <q-item>
                <q-item-label overline>
                    <div class="text-h6">{{ $t('history.title') }}</div>
                </q-item-label>
            </q-item>
            <q-separator />

            <q-item top dense v-for="item in history" :key="item.conversationId" clickable
                @click="showConversation(item.conversationId)">
                <q-item-section avatar>
                    <q-icon rounded size="xs" name="mdi-message-outline" :color="iconColor" />
                </q-item-section>

                <q-item-section>
                    <q-item-label>
                        {{ item.title }}
                    </q-item-label>
                </q-item-section>

                <q-item-section side>
                    <q-btn dense flat icon="mdi-delete-outline" :color="iconColor"
                        @click="deleteConversation(item.conversationId)">
                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                            {{ $t('history.delete') }}
                        </q-tooltip>
                    </q-btn>
                </q-item-section>

            </q-item>

        </q-list>
    </q-card>
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
        const { history, conversationId } = storeToRefs(teamsStore);
        const $q = useQuasar();
        const { t } = useI18n();

        const showConversation = (id) => {
            conversationId.value = id;
        }

        const deleteConversation = (id) => {
            teamsStore.deleteConversation(id);
        }

        return {
            t,
            showConversation,
            deleteConversation,
            history,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style></style>
