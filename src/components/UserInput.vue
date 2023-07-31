<template>
    <q-input dense filled autofocus autogrow style="width: 100%;" :dark="$q.dark.isActive"
        :placeholder="t('userInput.placeholder')" @keydown.enter.prevent="handleUserInput" v-model="question"
        :loading="loading">

        <template v-slot:prepend>

            <q-btn dense flat :icon="!isCreateImageSelected ? 'mdi-tooltip-text' : 'mdi-tooltip-text-outline'"
                :color="!isCreateImageSelected ? 'primary' : iconColor" @click="isCreateImageSelected = !isCreateImageSelected">
                
                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                    {{ t('userInput.tooltip.generateText') }}
                </q-tooltip>
            </q-btn>

            <q-btn dense flat :icon="isCreateImageSelected ? 'mdi-tooltip-image' : 'mdi-tooltip-image-outline'"
                :color="isCreateImageSelected ? 'primary' : iconColor" @click="isCreateImageSelected = !isCreateImageSelected">

                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                    {{ t('userInput.tooltip.generateImage') }}
                </q-tooltip>
            </q-btn>
        </template>

        <template v-slot:append>
            <q-btn v-if="!loading" @click="handleUserInput" dense flat icon="mdi-send" :color="iconColor">
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
        const { loading, userInput, isCreateImageSelected } = storeToRefs(teamsStore);
        const question = ref('');
        const { t } = useI18n();
        const $q = useQuasar();

        function handleUserInput() {
            if (question.value == '') { return; }

            userInput.value = question.value;
            question.value = '';
        }

        return {
            handleUserInput,
            isCreateImageSelected,
            question,
            t,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8'),
            loading
        }
    }
}
</script>
