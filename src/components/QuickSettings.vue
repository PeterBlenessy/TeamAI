<template>
    <div class="row">
        <q-toolbar class="col-6">
            <q-chip v-if="!isCreateImageSelected" icon="model_training" :label="model" size="sm" clickable
                @click="nextModel()">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.model.label') }}
                </q-tooltip>
            </q-chip>

            <q-chip v-if="!isCreateImageSelected" icon="short_text" :label="maxTokens" size="sm" clickable
                @click="showQuickSettings = (showQuickSettings != 'maxTokens') ? 'maxTokens' : ''">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.maxTokens.label') }}
                </q-tooltip>
            </q-chip>

            <q-chip v-if="!isCreateImageSelected" icon="thermostat" :label="temperature" size="sm" clickable
                @click="showQuickSettings = (showQuickSettings != 'temperature') ? 'temperature' : ''">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.temperature.label') }}
                </q-tooltip>
            </q-chip>

            <q-separator v-if="!isCreateImageSelected" vertical inset class="q-ma-sm" />

            <q-chip v-if="isCreateImageSelected" icon="mdi-image-multiple-outline" :label="choices" size="sm" clickable
                @click="showQuickSettings = (showQuickSettings != 'choices') ? 'choices' : ''">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.choices.label') }}
                </q-tooltip>
            </q-chip>

            <q-chip v-if="isCreateImageSelected" icon="mdi-image-size-select-large" :label="imageSize" size="sm" clickable
                @click="showQuickSettings = (showQuickSettings != 'imageSize') ? 'imageSize' : ''">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.size.label') }}
                </q-tooltip>
            </q-chip>

            <q-chip v-if="!isCreateImageSelected" v-for="persona in personas" :key="persona.id" size="sm" clickable
                removable @remove="removePersona(persona.id)">
                <q-avatar size="sm">
                    <img v-if="persona.avatar" :src="persona.avatar" />
                    <q-icon v-else name="mdi-account-circle" size="sm" />
                </q-avatar>
                {{ persona.name }}
            </q-chip>
        </q-toolbar>

        <q-space />

        <q-toolbar class="col-6">
            <q-slider v-if="showQuickSettings == 'maxTokens'" :model-value="maxTokens" @change="val => { maxTokens = val }"
                :min="64" :max="4096" :step="16" :markers="1024" label />

            <q-slider v-if="showQuickSettings == 'temperature'" :model-value="temperature"
                @change="val => { temperature = val }" :min="0" :max="2" :step="0.1" :markers="0.5" label />

            <q-slider v-if="showQuickSettings == 'choices'" :model-value="choices" @change="val => { choices = val }" snap
                :min="1" :max="10" :step="1" :markers="1" label />

            <q-slider v-if="showQuickSettings == 'imageSize'" :model-value="imageSizeValue"
                @update:model-value="val => { imageSizeValue = val }" snap :min="0" :max="2" :step="1" :markers="1" label
                :label-value="imageSize" />

        </q-toolbar>
    </div>
</template>
<script>

import { computed, ref, watch } from 'vue';
import { useSettingsStore } from '../stores/settings-store.js';
import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

export default {
    name: "QuickSettings",

    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const settingsStore = useSettingsStore();
        const {
            conversationMode,
            model,
            modelOptions,
            maxTokens,
            temperature,
            choices,
            imageSize,
            personas,
            speechLanguage,
            userAvatar
        } = storeToRefs(settingsStore);

        const showQuickSettings = ref('');

        watch(showQuickSettings, () => {
            if (showQuickSettings.value != '') {
                // Set timer to hide quick settings after 30 seconds
                setTimeout(() => {
                    showQuickSettings.value = '';
                }, 30000);
            }
        });

        const teamsStore = useTeamsStore();
        const { isCreateImageSelected } = storeToRefs(teamsStore);

        const imageSizeOptions = ref(['256x256', '512x512', '1024x1024']);
        const imageSizeValue = ref(imageSizeOptions.value.indexOf(imageSize.value));
        watch(imageSizeValue, () => {
            imageSize.value = imageSizeOptions.value[imageSizeValue.value];
        });

        // Remove persona from personas
        const removePersona = (id) => {
            personas.value = personas.value.filter(persona => persona.id !== id);
        }

        return {
            t,
            speechLanguage,
            conversationMode,
            model,
            modelOptions,
            maxTokens,
            temperature,
            choices,
            imageSize,
            imageSizeValue,
            personas,
            userAvatar,
            isCreateImageSelected,

            removePersona,

            showQuickSettings,
            nextModel: () => {
                showQuickSettings.value = '';
                let index = modelOptions.value.indexOf(model.value);
                index = (index + 1) % modelOptions.value.length;
                model.value = modelOptions.value[index];
            },

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>

