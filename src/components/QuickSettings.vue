<template>
    <div class="row">
        <q-toolbar>
            <!-- Model name -->
            <q-chip icon="mdi-brain" :label="isCreateImageSelected ? 'DALL·E 3' : model" size="sm" clickable>
                <q-menu v-if="!isCreateImageSelected" anchor="top left" self="bottom left" style="max-width: 350px">
                    <q-list dense>
                        <q-item v-for="(item, index) in modelOptions" :key="index" clickable @click="model = item.model"
                            :active="model == item.model">
                            <q-item-section no-wrap><q-item-label>{{ item.model }}</q-item-label>
                                <q-tooltip :delay="100" transition-show="scale" transition-hide="scale">
                                    {{ item.provider }}
                                </q-tooltip>
                            </q-item-section>
                            <q-item-section no-wrap side>
                                <q-item-label caption>{{ item.provider }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.text.model.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Max tokens selection -->
            <q-chip v-if="!isCreateImageSelected" :label="maxTokens" size="sm" clickable
                :icon="maxTokens < 1024 ? 'mdi-text-short' : maxTokens < 2048 ? 'mdi-text' : 'mdi-text-long'">

                <q-menu anchor="top middle" self="bottom middle">
                    <div class="q-pa-sm">
                        <q-slider v-model="maxTokens" :min="64" :max="4096" :step="16" :markers="1024" vertical
                            reverse />
                    </div>
                </q-menu>
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.text.maxTokens.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Text generation temperature -->
            <q-chip v-if="!isCreateImageSelected" icon="mdi-thermometer" :label="temperature" size="sm" clickable>
                <q-menu anchor="top middle" self="bottom middle">
                    <div class="q-pa-sm">
                        <q-slider v-model="temperature" :min="0" :max="2" :step="0.1" :markers="0.5" vertical reverse />
                    </div>
                </q-menu>
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.text.temperature.label') }}
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
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.text.choices.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Image size -->
            <q-chip v-if="isCreateImageSelected" icon="mdi-image-size-select-large" :label="imageSize" size="sm"
                clickable>
                <q-menu anchor="top middle" self="bottom middle">
                    <div class="q-pa-sm">
                        <q-slider v-model="imageSizeValue" snap :min="0" :max="2" :step="1" :markers="1" vertical
                            reverse />
                    </div>
                </q-menu>
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.image.size.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Image quality toggle -->
            <q-chip v-if="isCreateImageSelected"
                :icon="imageQuality == 'hd' ? 'mdi-high-definition' : 'mdi-standard-definition'" size="md" clickable
                @click="imageQuality = imageQuality == 'hd' ? 'standard' : 'hd'">
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.image.quality.label') }}
                </q-tooltip>
            </q-chip>

            <!-- Image style toggle -->
            <q-chip v-if="isCreateImageSelected" icon="mdi-palette-outline"
                :label="imageStyle == 'vivid' ? t('settings.image.style.vivid') : t('settings.image.style.natural')"
                size="sm" clickable @click="imageStyle = imageStyle == 'vivid' ? 'natural' : 'vivid'">
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.image.style.label') }}
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
                        <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
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
                        <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ scope.opt.prompt }}
                        </q-tooltip>

                    </q-item>

                </template>

            </q-select>

            <q-separator v-if="appMode == 'advanced' && !isCreateImageSelected" vertical inset class="q-ma-sm" />

            <!-- Team work toggle -->
            <q-chip dense v-if="appMode == 'advanced' && !isCreateImageSelected" size="sm" icon="mdi-account-group-outline"
                clickable>

                <q-toggle v-model="isTeamWorkActivated" flat dense left-label size="md"
                    :label="t('settings.text.teamWork.label')" unchecked-icon="mdi-account"
                    checked-icon="mdi-account-group">
                    <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                        {{ t('settings.text.teamWork.tooltip') }}
                    </q-tooltip>
                </q-toggle>

            </q-chip>

            <q-chip v-if="!isCreateImageSelected" dense>
                <q-toggle v-model="conversationMode" flat dense size="md" unchecked-icon="mdi-message-outline"
                    checked-icon="mdi-forum-outline" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.conversationMode.tooltip') }}
                </q-tooltip>
            </q-chip>

            <q-chip v-if="!isCreateImageSelected" dense>
                <q-toggle v-model="streamResponse" dense :toggle-indeterminate="false" 
                    unchecked-icon="mdi-text-box-outline" checked-icon="mdi-text-short" size="md"
                />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.streamResponse.tooltip') }}
                </q-tooltip>
            </q-chip>

            <q-separator v-if="appMode == 'advanced' && !isCreateImageSelected" vertical inset class="q-ma-sm" />

            <q-space />

            <!-- Action buttons: Copy, Share, Delete -->
            <q-btn flat dense padding="xs" size="sm" icon="mdi-content-copy" clickable
                @click="copyConversation(conversationId)">
                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                    {{ $t('quickSettings.copy.tooltip') }}
                </q-tooltip>
            </q-btn>

            <q-btn dense flat padding="xs" size="sm" icon="mdi-export-variant" clickable
                @click="shareConversation(conversationId)">
                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                    {{ $t('quickSettings.share.tooltip') }}
                </q-tooltip>
            </q-btn>

            <q-btn dense flat padding="xs" size="sm" icon="mdi-delete-outline" clickable
                @click="deleteConversation(conversationId)">
                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                    {{ $t('quickSettings.delete.tooltip') }}
                </q-tooltip>
            </q-btn>

            <q-btn dense flat padding="xs" size="sm" icon="mdi-information-outline" clickable
                @click="showConversationInfo(conversationId)">
                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                    {{ $t('quickSettings.info.tooltip') }}
                </q-tooltip>
            </q-btn>
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
import providersConfig from '../services/providers.config.json';
import { exportConversation } from '../services/helpers.js';
import logger from '../services/logger';

export default {
    name: "QuickSettings",

    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const settingsStore = useSettingsStore();
        const {
            appMode,
            conversationMode,
            streamResponse,
            apiProviders,
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
        const { conversationId, isCreateImageSelected, isTeamWorkActivated, messages } = storeToRefs(teamsStore);
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

        // Computed array of { providers, models } to use in select options
        const modelOptions = computed(() => {
            return apiProviders.value.map(provider => {
                return provider.models.map(model => ({
                    provider: provider.name,
                    model: model
                }));
            }).flat()
        });

        const modelOptions2 = computed(() => {
            return apiProviders.value.map(provider => {
                return provider.models.map(model => ({
                    "label": model,
                    "provider": provider.name,
                    "value": model
                }));
            }).flat()
        });

        // Load OpenAI API format parameters
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


        // Show message info
        const showConversationInfo = (id) => {


            let totalTokens = messages.value
                .filter((message) => message.conversationId == conversationId.value)
                .reduce((sum, message) => {
                    return sum + (message?.usage?.total_tokens || 0);
                }, 0);

            let info = `
                <div class="text-subtitle1">${t('quickSettings.info.usage')}</div>
                <div class="text-caption"><pre>${totalTokens}</pre></div>
            `;

            $q.dialog({
                title: t('quickSettings.info.title'),
                message: info,
                html: true,
                cancel: false,
                persistent: false,
                ok: {
                    label: 'Ok',
                    color: 'primary',
                    flat: true
                }
            });
        };


        return {
            t,
            speechLanguage,
            conversationMode,
            streamResponse,
            appMode,
            model,
            modelOptions,
            modelOptions2,
            maxTokens,
            temperature,
            choices,
            imageSize,
            imageSizeValue,
            imageQuality,
            imageQualityValue,
            imageStyle,
            userAvatar,
            isCreateImageSelected,
            isTeamWorkActivated,

            personas,
            personaOptions,
            personaFilterFn,

            conversationId,

            copyConversation: (id) => navigator.clipboard.writeText(exportConversation(id)).then(logger.log("[QuickSettings] - Copied conversation to clipboard")).catch(e => logger.error(`[QuickSettings] - ${e}`)),
            deleteConversation: (id) => teamsStore.deleteConversation(id),
            shareConversation: (id) => navigator.share({ text: exportConversation(id) }).then(logger.log("[QuickSettings] - Shared conversation")).catch(e => logger.error(`[QuickSettings] - ${e}`)),
            showConversationInfo,

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>
