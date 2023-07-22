<template>
    <q-scroll-area ref="scrollAreaMessages" style="height:100vh" :visible="false" :delay="0">
        <div v-for="message in filteredMessages" :key="message.timestamp">
            <q-card flat square :class="'message-card ' + getBgColor(message.role)">
                <q-item top dense>
                    <q-item-section avatar top>
                        <q-icon rounded size="md" :name="message.role == 'user' ? 'account_box' : 'computer'"
                            :color="iconColor" />
                    </q-item-section>

                    <q-item-section top>
                        <q-item-label>
                            <q-markdown :src="message.content" :plugins="mdPlugins" />
                        </q-item-label>
                    </q-item-section>
                </q-item>
            </q-card>
        </div>
    </q-scroll-area>
</template>

<script>

import { useTeamsStore } from '../stores/teams-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import '@quasar/quasar-ui-qmarkdown/dist/index.css';
import mermaid from '@datatraccorporation/markdown-it-mermaid';
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

export default {
    name: 'Messages',
    components: {
        QMarkdown
    },
    setup() {
        const $q = useQuasar();
        const scrollAreaMessages = ref(null);

        const teamsStore = useTeamsStore();
        const { loading, conversationId, messages } = storeToRefs(teamsStore);
        const settingsStore = useSettingsStore();
        const { chatDirection } = storeToRefs(settingsStore);

        // Get message background color
        const getBgColor = (role) => {
            return role == 'user'
                ? $q.dark.isActive ? 'bg-grey-8' : 'bg-grey-1'
                : $q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3';
        }
        // Filter messages for specified conversationId
        const filteredMessages = computed(() => {
            const temp = messages.value.filter(message => message.conversationId == conversationId.value);
            return chatDirection.value == 'up' ? temp : temp.reverse();
        });

        // Reactive scroll area height
        const scrollAreaHeight = computed(() => scrollAreaMessages.value == null ? 0 : scrollAreaMessages.value.getScroll().verticalSize );

        // Load messages from conversationId
        watch(conversationId, () => filteredMessages);

        // Scroll to bottom of messages when new message is added
        watch(scrollAreaHeight, () => {
            let endOfMessages = chatDirection.value == 'up' ? 1 : 0;
            scrollAreaMessages.value.setScrollPercentage('vertical', endOfMessages);
        }, { flush: 'post' });

        return {
            chatDirection,
            filteredMessages,
            getBgColor,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8'),
            loading,
            mdPlugins: [mermaid],
            scrollAreaMessages
        }
    }
}
</script>

<style>
/* General card styling */
.message-card {
    padding: 20px;
    padding-top: 10px;
}

/* Markdown div styling */
.q-markdown {
    padding-right: 50px;
}
</style>
