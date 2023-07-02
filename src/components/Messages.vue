<template>
    <q-list>

        <q-item v-if="loading">
            <q-item-section top>
                <q-item-label>
                    <q-skeleton type="text" width="100%" />
                    <q-skeleton type="text" width="75%" />
                </q-item-label>
            </q-item-section>
        </q-item>

        <div v-for="message in [...filteredMessages].reverse()" :key="message.timestamp">
            <q-item top dense>
                <q-item-section avatar top>
                    <q-icon rounded size="md" :name="message.role == 'user' ? 'account_box' : 'computer'" :color="iconColor" />
                </q-item-section>

                <q-separator vertical spaced />

                <q-item-section top>
                    <q-item-label>
                        <q-markdown :src="message.content" :plugins="mdPlugins" />
                    </q-item-label>
                </q-item-section>
            </q-item>

            <q-separator inset spaced />
        </div>

    </q-list>
</template>

<script>

import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import '@quasar/quasar-ui-qmarkdown/dist/index.css';
import mermaid from '@datatraccorporation/markdown-it-mermaid';
import { useQuasar } from 'quasar';
import { computed, watch } from 'vue';

export default {
    name: 'Messages',
    components: {
        QMarkdown
    },
    setup() {
        const teamsStore = useTeamsStore();
        const { loading, conversationId, messages } = storeToRefs(teamsStore);
        const $q = useQuasar();

        const filteredMessages = computed(() => {
            return messages.value.filter(message => message.conversationId == conversationId.value);
        });

        watch(conversationId, () => filteredMessages );

        return {
            loading,
            filteredMessages,
            mdPlugins: [mermaid],
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style>
/* Markdown div styling */
.q-markdown {
    padding-right: 50px;
}
</style>
