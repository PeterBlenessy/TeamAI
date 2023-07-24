<template>
    <q-card style="min-width: 60%; max-width: 70%">
        <q-card-section>
            <div class="text-h6">
                {{ t('history.title') }}
            </div>
            {{ t('history.description') }}
        </q-card-section>
        <q-separator />

        <q-card-section>
            <q-list>
                <div v-for="(group, groupName) in groupedHistory" :key="groupName">

                    <q-item-label label>{{ $t('history.groups.' + groupName) }}</q-item-label>
                    <q-item v-for="item in group" :key="item.conversationId" top dense clickable
                        @click="showConversation(item.conversationId)">

                        <q-item-section avatar>
                            <q-icon rounded size="xs" name="mdi-chat-outline" :color="iconColor" />
                        </q-item-section>

                        <q-item-section>
                            <q-input borderless standout dense 
                                :input-style="item.readonly ? {cursor: 'pointer'} : {cursor: 'text'}"
                                :readonly="item.readonly"
                                focus="item.readonly"
                                v-model="item.title"
                                @blur="item.readonly=true">

                                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                    {{ $t('history.tooltip.show') }}
                                </q-tooltip>
                            </q-input>
                        </q-item-section>

                        <q-item-section side>
                            <div class="q-gutter-xs">
                                <q-btn size="sm" flat dense :color="iconColor"
                                    :icon="item.readonly ? 'mdi-pencil-outline':'mdi-content-save-outline'"
                                    @click="item.readonly = !item.readonly">

                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ item.readonly ? $t('history.tooltip.edit') : $t('history.tooltip.save') }}
                                    </q-tooltip>
                                </q-btn>

                                <q-btn size="sm" flat dense icon="mdi-content-copy" :color="iconColor"
                                    @click="copyConversation(item.conversationId)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ $t('history.tooltip.copy') }}
                                    </q-tooltip>
                                </q-btn>

                                <q-btn size="sm" flat dense icon="mdi-export-variant" :color="iconColor"
                                    @click="shareConversation(item.conversationId)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ $t('history.tooltip.share') }}
                                    </q-tooltip>
                                </q-btn>

                                <q-btn size="sm" flat dense icon="mdi-delete-outline" :color="iconColor"
                                    @click="deleteConversation(item.conversationId)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ $t('history.tooltip.delete') }}
                                    </q-tooltip>
                                </q-btn>
                            </div>
                        </q-item-section>

                    </q-item>


                </div>
            </q-list>
        </q-card-section>
    </q-card>
</template>

<script>

import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
    name: 'History',
    setup() {
        const teamsStore = useTeamsStore();
        const { history, conversationId } = storeToRefs(teamsStore);
        const $q = useQuasar();
        const { t } = useI18n();

        function getDateGroup(timestamp) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            const thisWeekStart = new Date(today);
            thisWeekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Make Monday the first day of the week

            const lastWeekStart = new Date(thisWeekStart);
            lastWeekStart.setDate(thisWeekStart.getDate() - 7);

            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const thisYearStart = new Date(now.getFullYear(), 0, 1);

            // Check if the date timestamp is stored as a string
            if (isNaN(Date.parse(timestamp))) {
                timestamp = parseInt(timestamp);
            }

            const date = new Date(timestamp);  // convert the input to a date if it isn't already

            if (date >= today) {
                return 'Today';
            } else if (date >= yesterday) {
                return 'Yesterday';
            } else if (date >= thisWeekStart) {
                return 'ThisWeek';
            } else if (date >= lastWeekStart) {
                return 'LastWeek';
            } else if (date >= thisMonthStart) {
                return 'ThisMonth';
            } else if (date >= thisYearStart) {
                return date.toLocaleString('default', { month: 'long' });
            } else {
                return date.getFullYear().toString();
            }
        }

        const groupedHistory = computed(() => {
            const grouped = {};
            const reversedHistory = [...history.value].reverse();
            reversedHistory.forEach(item => {
                const date = getDateGroup(item.timestamp);
                item.readonly = true;
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(item);
            });
            return grouped;
        });

        return {
            t,
            showConversation: (id) => conversationId.value = id,
            copyConversation: (id) => navigator.clipboard.writeText(JSON.stringify(teamsStore.getConversation(id))),
            deleteConversation: (id) => teamsStore.deleteConversation(id),
            shareConversation: (id) => navigator.share({ text: JSON.stringify(teamsStore.getConversation(id))}),
            history,
            groupedHistory,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style></style>
