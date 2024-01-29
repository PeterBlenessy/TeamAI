<template>
    <div class="row">
        <q-toolbar>
            <!-- Model name -->
            <q-chip icon="mdi-brain" :label="isCreateImageSelected ? 'DALL·E 3' : model" size="sm" clickable
                @click="nextModel()">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.model.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Max tokens selection -->
            <q-chip v-if="!isCreateImageSelected" :label="maxTokens" size="sm" clickable
                :icon="maxTokens < 1024 ? 'mdi-text-short' : maxTokens < 2048 ? 'mdi-text' : 'mdi-text-long'">

                <q-menu anchor="top middle" self="bottom middle">
                    <div class="q-pa-sm">
                        <q-slider v-model="maxTokens" :min="64" :max="4096" :step="16" :markers="1024" vertical reverse />
                    </div>
                </q-menu>
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.maxTokens.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Text generation temperature -->
            <q-chip v-if="!isCreateImageSelected" icon="mdi-thermometer" :label="temperature" size="sm" clickable>
                <q-menu anchor="top middle" self="bottom middle">
                    <div class="q-pa-sm">
                        <q-slider v-model="temperature" :min="0" :max="2" :step="0.1" :markers="0.5" vertical reverse />
                    </div>
                </q-menu>
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.temperature.label') }}
                </q-tooltip>
            </q-chip>

            <q-separator v-if="!isCreateImageSelected" vertical inset class="q-ma-sm" />

            <!-- Image choices selection -->
            <q-chip v-if="isCreateImageSelected && false" icon="mdi-image-multiple-outline" :label="choices" size="sm"
                clickable>
                <q-menu anchor="top middle" self="bottom middle">
                    <div class="q-pa-sm">
                        <q-slider v-model="choices" snap :min="1" :max="10" :step="1" :markers="1" vertical reverse />
                    </div>
                </q-menu>
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.choices.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Image size -->
            <q-chip v-if="isCreateImageSelected" icon="mdi-image-size-select-large" :label="imageSize" size="sm" clickable>
                <q-menu anchor="top middle" self="bottom middle">
                    <div class="q-pa-sm">
                        <q-slider v-model="imageSizeValue" snap :min="0" :max="2" :step="1" :markers="1" vertical reverse />
                    </div>
                </q-menu>
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.size.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Image quality toggle -->
            <q-chip v-if="isCreateImageSelected"
                :icon="imageQuality == 'hd' ? 'mdi-high-definition' : 'mdi-standard-definition'" size="md" clickable
                @click="imageQuality = imageQuality == 'hd' ? 'standard' : 'hd'">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.quality.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Image style toggle -->
            <q-chip v-if="isCreateImageSelected" icon="mdi-palette-outline"
                :label="imageStyle == 'vivid' ? t('settings.openAI.style.vivid') : t('settings.openAI.style.natural')"
                size="sm" clickable @click="imageStyle = imageStyle == 'vivid' ? 'natural' : 'vivid'">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.openAI.style.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Persona selection -->
            <q-select v-if="appMode == 'advanced' && !isCreateImageSelected" dense options-dense use-chips multiple
                borderless :option-label="(item) => item === null ? 'Null value' : item.name" v-model="personas"
                :options="personaOptions" @filter="personaFilterFn">

                <template v-slot:selected-item="scope">
                    <q-chip dense size="sm" removable @remove="scope.removeAtIndex(scope.index)">
                        <q-avatar size="sm">
                            <img v-if="scope.opt.avatar" :src="scope.opt.avatar" />
                            <q-icon v-else name="mdi-account-circle" size="sm" />
                        </q-avatar>
                        {{ scope.opt.name }}
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ scope.opt.prompt }}
                        </q-tooltip>

                    </q-chip>
                </template>

                <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                            <q-avatar size="sm">
                                <img v-if="scope.opt.avatar" :src="scope.opt.avatar" />
                                <q-icon v-else name="mdi-account-circle" size="sm" />
                            </q-avatar>
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>{{ scope.opt.name }}</q-item-label>
                        </q-item-section>
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ scope.opt.prompt }}
                        </q-tooltip>

                    </q-item>

                </template>

            </q-select>

            <q-separator v-if="appMode == 'advanced' && !isCreateImageSelected" vertical inset class="q-ma-sm" />

            <!-- Team work toggle -->
            <q-chip v-if="appMode == 'advanced' && !isCreateImageSelected" size="sm" icon="mdi-account-group-outline"
                clickable>

                <q-toggle v-model="isTeamWorkActivated" flat dense left-label size="md"
                    :label="t('settings.teamWork.label')" unchecked-icon="mdi-account" checked-icon="mdi-account-group">
                    <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                        {{ t('settings.teamWork.tooltip') }}
                    </q-tooltip>
                </q-toggle>

            </q-chip>

            <q-separator v-if="appMode == 'advanced' && !isCreateImageSelected" vertical inset class="q-ma-sm" />

            <!-- Clear messages button -->
            <q-chip size="md" icon="mdi-delete-sweep" clickable @click="clearMessages()">
                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('toolbar.tooltip.clear') }}
                </q-tooltip>
            </q-chip>

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
import openaiConfig from '../services/openai.config.json';

export default {
    name: "QuickSettings",

    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const settingsStore = useSettingsStore();
        const {
            appMode,
            conversationMode,
            model,
            maxTokens,
            temperature,
            choices,
            imageSize,
            imageQuality,
            imageStyle,
            personas,
            speechLanguage,
            userAvatar
        } = storeToRefs(settingsStore);

        const teamsStore = useTeamsStore();
        const { conversationId, isCreateImageSelected, isTeamWorkActivated } = storeToRefs(teamsStore);
        const personaOptions = ref(teamsStore.personas);

        // Filters personas based on input characters in the select box
        function personaFilterFn(val, update) {
            if (val === '') {
                update(() => personaOptions.value = teamsStore.personas);
                return;
            }

            update(() => {
                const needle = val.toLowerCase();
                personaOptions.value = teamsStore.personas.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
            });
        }
        // Clear messages in current conversation.
        function clearMessages() {
            teamsStore.deleteMessages(conversationId.value);
        }

        // Load OpenAI model options
        const modelOptions = openaiConfig.gptModels;
        const imageSizeOptions = openaiConfig.imageSizeOptions;
        const imageQualityOptions = openaiConfig.imageQualityOptions;
        const imageStyleOptions = openaiConfig.imageStyleOptions;

        const imageSizeValue = ref(imageSizeOptions.indexOf(imageSize.value));
        const imageQualityValue = ref(imageQualityOptions.indexOf(imageQuality.value));
        const imageStyleValue = ref(imageStyleOptions.indexOf(imageStyle.value));

        watch(imageSizeValue, () => {
            imageSize.value = imageSizeOptions[imageSizeValue.value];
        });

        watch(imageQualityValue, () => {
            imageQuality.value = imageQualityOptions[imageQualityValue.value];
        });

        watch(imageStyleValue, () => {
            imageStyle.value = imageStyleOptions[imageStyleValue.value];
        });

        return {
            t,
            speechLanguage,
            conversationMode,
            appMode,
            model,
            maxTokens,
            temperature,
            choices,
            imageSize,
            imageSizeValue,
            imageQuality,
            imageQualityValue,
            imageStyle,
            personas,
            userAvatar,
            isCreateImageSelected,
            isTeamWorkActivated,

            personaOptions,
            personaFilterFn,
            clearMessages,

            nextModel: () => {
                if (isCreateImageSelected.value) {
                    return;
                }

                let index = modelOptions.indexOf(model.value);
                index = (index + 1) % modelOptions.length;
                model.value = modelOptions[index];
            },

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>

