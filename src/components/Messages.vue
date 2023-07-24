<template>
    <div v-for="message in filteredMessages" :key="message.timestamp" scroll>
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

                <q-item-section side top>
                    <q-btn size="sm" flat dense icon="mdi-content-copy" :color="iconColor"
                        @click="copyMessage(message.content)">
                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                            {{ $t('messages.tooltip.copy') }}
                        </q-tooltip>
                    </q-btn>

                    <q-btn size="sm" flat dense icon="mdi-delete-outline" :color="iconColor"
                        @click="deleteMessage(message.timestamp)">
                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                            {{ $t('messages.tooltip.delete') }}
                        </q-tooltip>
                    </q-btn>
                </q-item-section>
            </q-item>
        </q-card>
    </div>
</template>

<script>

import { useTeamsStore } from '../stores/teams-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import '@quasar/quasar-ui-qmarkdown/dist/index.css';
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { scroll } from 'quasar'
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

        // Load messages from conversationId
        watch(conversationId, () => filteredMessages);

        // Scroll new message into view
        watch(filteredMessages, () => {
            const { getScrollTarget, setVerticalScrollPosition } = scroll;

            const page = document.getElementById('page');
            const target = getScrollTarget(page);
            const offset = chatDirection.value == 'up' ? page.offsetHeight : 0;
            setVerticalScrollPosition(target, offset, 100)
        }, { flush: 'post' });

        return {
            chatDirection,
            filteredMessages,
            getBgColor,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8'),
            loading,
            mdPlugins: [],
            copyMessage: (content) => navigator.clipboard.writeText(content),
            deleteMessage: (timestamp) => teamsStore.deleteMessage(timestamp),
        }
    }
}
</script>

<style>
/* General card styling */
.message-card {
    padding-bottom: 10px;
    padding-top: 10px;
}

/* Markdown div styling */
.q-markdown {
    padding-right: 50px;
}
</style>
