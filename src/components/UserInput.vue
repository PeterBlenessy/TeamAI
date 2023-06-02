<template>
    <q-input dark dense filled autofocus autogrow :placeholder="t('userInput.placeholder')" color="white"
        style="min-width: 85%; max-width: 85%;" @keydown.enter.prevent="handleUserInput" v-model="question">
        <template v-slot:prepend>
            <q-icon name="live_help" style="padding: 5px" color="white" />
        </template>
        <template v-slot:append>
            <q-btn @click="handleUserInput" dense flat icon="send" color="white">
                <q-tooltip delay="750" transition-show="scale" transition-hide="scale">
                    {{ t('userInput.tooltip.send') }}
                </q-tooltip>
            </q-btn>
        </template>
    </q-input>
</template>

<script>
import { ref } from 'vue';
import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

export default {
    name: 'UserInput',
    setup() {
        const teamsStore = useTeamsStore();
        const { userInput, loading } = storeToRefs(teamsStore);
        const question = ref('');
        const { t } = useI18n();

        function handleUserInput() {
            userInput.value = question.value;
            question.value = '';
        }
        return {
            handleUserInput,
            loading,
            question,
            t
        }
    }
}
</script>
