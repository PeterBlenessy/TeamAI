<template>
    <q-toolbar>
        <q-input dense filled autofocus autogrow style="width: 100%;" :dark="$q.dark.isActive"
            :placeholder="isCreateImageSelected ? t('userInput.placeholder.image') : t('userInput.placeholder.text')"
            @keydown.enter.prevent="handleUserInput" v-model="question">

            <template v-slot:prepend>

                <q-btn dense flat :icon="!isCreateImageSelected ? 'mdi-tooltip-text' : 'mdi-tooltip-text-outline'"
                    :color="!isCreateImageSelected ? 'primary' : iconColor"
                    @click="isCreateImageSelected = !isCreateImageSelected">

                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('userInput.tooltip.generateText') }}
                    </q-tooltip>
                </q-btn>

                <q-btn dense flat :icon="isCreateImageSelected ? 'mdi-tooltip-image' : 'mdi-tooltip-image-outline'"
                    :color="isCreateImageSelected ? 'primary' : iconColor"
                    @click="isCreateImageSelected = !isCreateImageSelected">

                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ t('userInput.tooltip.generateImage') }}
                    </q-tooltip>
                </q-btn>

                <q-btn v-model="isMicrophoneActive" push dense flat
                    :icon="isMicrophoneActive ? 'mdi-microphone' : 'mdi-microphone-off'"
                    :color="isMicrophoneActive ? 'primary' : iconColor"
                    @click.stop="isMicrophoneActive ? stopSpeechRecognition() : startSpeechRecognition()"
                    :loading="speechDetected">

                    <template v-slot:loading>
                        <q-spinner-bars color="primary" @click.stop="stopSpeechRecognition()" />
                    </template>

                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ isMicrophoneActive ? t('userInput.tooltip.speechStop') : t('userInput.tooltip.speechStart') }}
                    </q-tooltip>
                </q-btn>

            </template>

            <template v-slot:append>
                <q-btn :loading="loading && !streamResponse" @click="handleUserInput" dense flat icon="mdi-send" :color="iconColor">
                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                        {{ loading ? t('userInput.tooltip.waiting') : t('userInput.tooltip.send') }}
                    </q-tooltip>
                    <template v-slot:loading v-if="!streamResponse">
                        <q-spinner color="primary" />
                    </template>

                </q-btn>
            </template>

        </q-input>
    </q-toolbar>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useTeamsStore } from '../stores/teams-store.js';
import { useSettingsStore } from "../stores/settings-store.js";
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

export default {
    name: 'UserInput',
    setup() {
        const teamsStore = useTeamsStore();
        const { loading, userInput, isCreateImageSelected } = storeToRefs(teamsStore);
        const settingsStore = useSettingsStore();
        const { speechLanguage, streamResponse } = storeToRefs(settingsStore);
        const question = ref('');
        const { t } = useI18n();
        const $q = useQuasar();

        function handleUserInput() {
            if (question.value == '') { return; }

            userInput.value = question.value;
            question.value = '';
            stopSpeechRecognition();
        }

        const isMicrophoneActive = ref(false);
        const speechDetected = ref(false);
        let recognition = null;

        onMounted(() => setupSpeechRecognition());
        watch(speechLanguage, () => setupSpeechRecognition());

        const setupSpeechRecognition = () => {
            // Ask for permission to use the microphone
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    // Check if SpeechRecognition is supported
                    if ('webkitSpeechRecognition' in window) {
                        // Configure SpeechRecognition
                        recognition = new webkitSpeechRecognition();
                        recognition.continuous = false; // continue or stop when user stops speaking
                        recognition.interimResults = true; // provide interim results or final only
                        recognition.lang = speechLanguage.value;

                        // Event handlers
                        recognition.onaudiostart = () => console.log("Audio capturing started");
                        recognition.onspeechstart = () => speechDetected.value = true;
                        recognition.onspeechend = () => speechDetected.value = false;
                        recognition.onresult = (event) => question.value = event.results[0][0].transcript;
                        recognition.onerror = (event) => console.log("Error: " + event.error + " - " + event.message);
                        recognition.onaudioend = () => console.log("Audio capturing ended");
                    } else {
                        console.log('SpeechRecognition is not supported in this browser.');
                        isMicrophoneActive.value = false;
                    }

                })
                .catch(err => {
                    console.log('No mic for you!')
                });
        }

        const startSpeechRecognition = () => {
            isMicrophoneActive.value = true;
            try {
                recognition.start();
            } catch (error) {
                console.log("Error: " + error.error + " - " + error.message);
            }
        }

        const stopSpeechRecognition = () => {
            isMicrophoneActive.value = false;
            speechDetected.value = false
            recognition.stop();
        }

        return {
            handleUserInput,
            isCreateImageSelected,
            question,
            t,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8'),
            loading,
            streamResponse,

            isMicrophoneActive,
            speechDetected,
            startSpeechRecognition,
            stopSpeechRecognition,
        }
    }
}
</script>
