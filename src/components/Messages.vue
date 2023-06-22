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
            <q-item top :class="message.role == 'user' ? 'bg-grey-9' : 'bg-grey-10'">
                <q-item-section top>
                    <q-item-label>
                        {{ message.content }}
                    </q-item-label>
                </q-item-section>
            </q-item>
        </div>

    </q-list>
</template>

<script>

import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';

export default {
    name: 'Messages',
    setup() {
        const teamsStore = useTeamsStore();
        const { loading, messages } = storeToRefs(teamsStore);

        return {
            loading,
            messages
        }
    }
}
</script>
