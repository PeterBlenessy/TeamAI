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

        <div v-for="message in [...messages].reverse()" :key="message.timestamp">
            <q-item top dense>
                <q-item-section avatar top>
                    <q-avatar rounded size="xl" :icon="message.role == 'user' ? 'account_box' : 'computer'" />
                </q-item-section>
                <q-item-section top>
                    <q-item-label>
                        <q-markdown :src="message.content" :plugins="mdPlugins" />
                    </q-item-label>
                </q-item-section>
            </q-item>

            <q-separator spaced inset="item" />
        </div>

    </q-list>
</template>

<script>

import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import '@quasar/quasar-ui-qmarkdown/dist/index.css';
import mermaid from '@datatraccorporation/markdown-it-mermaid';

export default {
    name: 'Messages',
    components: {
        QMarkdown
    },
    setup() {
        const teamsStore = useTeamsStore();
        const { loading, messages } = storeToRefs(teamsStore);

        return {
            loading,
            messages,
            mdPlugins: [mermaid]
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
