<template>
    <q-input dense filled autofocus autogrow style="min-width: 70%; max-width: 70%;" 
        :dark="$q.dark.isActive" 
        :placeholder="t('userInput.placeholder')" @keydown.enter.prevent="handleUserInput" v-model="question">

        <template v-slot:prepend>
            <q-icon name="live_help" style="padding: 5px"  :color="iconColor" />
        </template>

        <template v-slot:append>
            <q-btn @click="handleUserInput" dense flat icon="send"  :color="iconColor">
                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                    {{ t('userInput.tooltip.send') }}
                </q-tooltip>
            </q-btn>
        </template>

    </q-input>
</template>

<script>
import { ref, computed } from 'vue';
import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

export default {
    name: 'UserInput',
    setup() {
        const teamsStore = useTeamsStore();
        const { userInput } = storeToRefs(teamsStore);
        const question = ref('');
        const { t } = useI18n();
        const $q = useQuasar();

        function handleUserInput() {
            
            if (question.value == '') {
                return;
            }
            
            userInput.value = question.value;
            question.value = '';
        }
        return {
            handleUserInput,
            question,
            t,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>
