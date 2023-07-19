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

        <div v-for="message in filteredMessages" :key="message.timestamp">
            <q-separator inset spaced v-show="chatDirection==='up'"/>

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

            <q-separator inset spaced v-show="chatDirection==='down'"/>
        </div>

    </q-list>
</template>

<script>

import { useTeamsStore } from '../stores/teams-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
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
        const $q = useQuasar();
        const teamsStore = useTeamsStore();
        const { loading, conversationId, messages } = storeToRefs(teamsStore);
        const settingsStore = useSettingsStore();
        const { chatDirection } = storeToRefs(settingsStore);
        

        const filteredMessages = computed(() => {
            const temp = messages.value.filter(message => message.conversationId == conversationId.value);
            return chatDirection.value == 'up' ? temp : temp.reverse();
            //return messages.value.filter(message => message.conversationId == conversationId.value);
        });

        // Watch runtime changes to conversationId and load its messages
        watch(conversationId, () => filteredMessages );

        return {
            loading,
            filteredMessages,
            chatDirection,
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
