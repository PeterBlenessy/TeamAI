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
                            <q-item-label caption>{{ item.title }}
                                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                    {{ $t('history.tooltip.show') }}
                                </q-tooltip>
                            </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <q-btn size="sm" flat dense icon="mdi-delete-outline" :color="iconColor" 
                                @click="deleteConversation(item.conversationId)">
                                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                    {{ $t('history.tooltip.delete') }}
                                </q-tooltip>
                            </q-btn>
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
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(item);
            });
            return grouped;
        });

        return {
            t,
            showConversation,
            deleteConversation,
            history,
            groupedHistory,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style></style>
