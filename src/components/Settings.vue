<template>
    <q-card style="min-width: 50%; max-width: 60%">
        <q-card-section>
            <q-item>
                <q-item-section top>
                    <div class="text-h6">
                        {{ t('settings.title') }}
                    </div>
                </q-item-section>
                <q-item-section side avatar>
                    <q-file ref="avatarPicker" v-model="avatarImage" @update:model-value="handleAvatarSelected()"
                        accept=".png, .jpg, .jpeg, .svg" style="display:none" />

                    <q-avatar size="xl" @click="handleAvatarPicker()">
                        <q-img v-if="userAvatar" :src="userAvatar" @mouseover="showActionButton = true"
                            @mouseleave="showActionButton = false">
                            <q-btn class="absolute-bottom" size="sm" icon="mdi-swap-horizontal" v-show="showActionButton" />
                        </q-img>
                        <q-icon v-else name="mdi-account-circle" size="xl" :color="iconColor"
                            @mouseover="showActionButton = true" @mouseleave="showActionButton = false">
                            <q-btn class="absolute-bottom" size="sm" icon="mdi-plus-circle" v-show="showActionButton" />
                        </q-icon>
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.avatar.tooltip') }}
                        </q-tooltip>
                    </q-avatar>
                </q-item-section>
            </q-item>
        </q-card-section>

        <q-separator />
        <!-- General application settings -->
        <q-card-section>
            <q-list>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-compare" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ t('settings.darkMode.label') }}</q-item-label>
                        <q-item-label caption>{{ t('settings.darkMode.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle v-model="darkMode" toggle-indeterminate indeterminate-value='auto' flat dense round />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.darkMode.tooltip') }}
                        </q-tooltip>

                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-web" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ t('settings.locale.label') }}</q-item-label>
                        <q-item-label caption>{{ t('settings.locale.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-select :option-label="(item) => t('locale.' + item)" v-model="locale" :options="availableLocales"
                            dense options-dense />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.locale.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-microphone-message" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ t('settings.speech.label') }}</q-item-label>
                        <q-item-label caption>{{ t('settings.speech.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>

                        <q-select v-model="speechLanguage" dense options-dense :options="availableLocales"
                            :option-label="(item) => t('locale.' + item)" />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.speech.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-separator />

                <!-- User experience related settings -->
                <q-item>
                    <q-item-section avatar>
                        <q-icon :name="chatDirection == 'up' ? 'mdi-transfer-up' : 'mdi-transfer-down'"
                            :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ $t('settings.chatDirection.label') }}</q-item-label>
                        <q-item-label caption>{{ $t('settings.chatDirection.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle v-model="chatDirection" flat dense round false-value="up" true-value="down" />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.chatDirection.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon :name="conversationMode ? 'mdi-forum-outline' : 'mdi-message-outline'" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ $t('settings.conversationMode.label') }}</q-item-label>
                        <q-item-label caption>{{ $t('settings.conversationMode.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle v-model="conversationMode" flat dense round />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.conversationMode.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon :name="appMode == 'basic' ? 'mdi-account' : 'mdi-account-group'" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ $t('settings.appMode.label') }}</q-item-label>
                        <q-item-label caption>{{ $t('settings.appMode.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle v-model="appMode" dense false-value="basic" true-value="advanced" />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.appMode.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon :name="quickSettings == true ? 'mdi-cog' : 'mdi-cog-off'" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ $t('settings.quickSettings.label') }}</q-item-label>
                        <q-item-label caption>{{ $t('settings.quickSettings.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle v-model="quickSettings" dense :toggle-indeterminate="false"/>
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.quickSettings.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-set-split" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ $t('settings.streamResponse.label') }} 
                            <q-badge outline color="primary" label="Beta" />
                        </q-item-label>
                        <q-item-label caption>{{ $t('settings.streamResponse.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle v-model="streamResponse" dense :toggle-indeterminate="false"/>
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.streamResponse.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <!-- Persona selection -->
                <q-separator v-if="appMode == 'advanced'" />

                <q-item v-if="appMode == 'advanced'">
                    <q-item-section avatar>
                        <q-icon name="mdi-card-account-details-outline" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ t('settings.persona.label') }}</q-item-label>
                        <q-item-label caption>{{ $t('settings.persona.caption') }}</q-item-label>
                        <q-select dense options-dense use-input input-debounce="0" use-chips multiple
                            :option-label="(item) => item === null ? 'Null value' : item.name" v-model="personas"
                            :options="personaOptions" @filter="personaFilterFn">

                            <template v-slot:selected-item="scope">
                                <q-chip dense size="sm" class="q-ma-none" removable
                                    @remove="scope.removeAtIndex(scope.index)" color="primary">
                                    <q-avatar size="sm">
                                        <img v-if="scope.opt.avatar" :src="scope.opt.avatar" />
                                        <q-icon v-else name="mdi-account-circle" size="sm" />
                                    </q-avatar>
                                    {{ scope.opt.name }}
                                    <q-tooltip :delay="1000" max-width="300px" transition-show="scale"
                                        transition-hide="scale">
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
                                    <q-tooltip :delay="1000" max-width="300px" transition-show="scale"
                                        transition-hide="scale">
                                        {{ scope.opt.prompt }}
                                    </q-tooltip>

                                </q-item>

                            </template>

                        </q-select>
                    </q-item-section>
                </q-item>

                <q-separator />

                <!-- OpenAI settings -->
                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-key" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-input :model-value="apiKey" @change="val => { apiKey = val }"
                            :label="t('settings.openAI.apiKey.label')"
                            :placeholder="t('settings.openAI.apiKey.placeholder')" dense />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.apiKey.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <!-- Text generation settings -->
                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-brain" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label caption>{{ t('settings.openAI.model.label') }}</q-item-label>
                        <q-select v-model="model" :options="modelOptions" dense options-dense />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.model.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon
                            :name="maxTokens < 1024 ? 'mdi-text-short' : maxTokens < 2048 ? 'mdi-text' : 'mdi-text-long'"
                            :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label caption>{{ t('settings.openAI.maxTokens.label') }} ({{ maxTokens }})</q-item-label>
                        <q-slider :model-value="maxTokens" @change="val => { maxTokens = val }" :min="64" :max="4096"
                            :step="16" :markers="1024" label />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.maxTokens.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-thermometer" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label caption>{{ t('settings.openAI.temperature.label') }} ({{ temperature
                        }})</q-item-label>
                        <q-slider :model-value="temperature" @change="val => { temperature = val }" :min="0" :max="2"
                            :step="0.1" :markers="0.5" label />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.temperature.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-separator />
                <!-- Image generation settings -->

                <q-item v-if="false">
                    <q-item-section avatar>
                        <q-icon name="mdi-image-multiple-outline" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label caption>{{ t('settings.openAI.choices.label') }} ({{ choices }})</q-item-label>
                        <q-slider :model-value="choices" @change="val => { choices = val }" snap :min="1" :max="10"
                            :step="1" :markers="1" label />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.choices.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-image-size-select-large" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label caption>{{ t('settings.openAI.size.label') }} ({{ imageSize }})</q-item-label>
                        <q-slider :model-value="imageSizeValue" @update:model-value="val => { imageSizeValue = val }" snap
                            :min="0" :max="2" :step="1" :markers="1" label :label-value="imageSize" />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.size.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon :name="imageQuality == 'hd' ? 'mdi-high-definition' : 'mdi-standard-definition'"
                            :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label caption>{{ t('settings.openAI.quality.label') }} ({{ imageQuality }})</q-item-label>
                        <q-slider :model-value="imageQualityValue" @update:model-value="val => { imageQualityValue = val }"
                            snap :min="0" :max="1" :step="1" :markers="1" label :label-value="imageQuality" />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.quality.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="mdi-palette" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label caption>{{ t('settings.openAI.style.label') }} ({{ imageStyle }})</q-item-label>
                        <q-slider :model-value="imageStyleValue" @update:model-value="val => { imageStyleValue = val }" snap
                            :min="0" :max="1" :step="1" :markers="1" label :label-value="imageStyle" />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.style.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

            </q-list>
        </q-card-section>
    </q-card>
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
    name: "AppSettings",

    setup() {
        const $q = useQuasar();
        const { t, locale, availableLocales } = useI18n();
        const settingsStore = useSettingsStore();
        const {
            appMode,
            darkMode,
            conversationMode,
            chatDirection,
            apiKey,
            model,
            maxTokens,
            temperature,
            choices,
            imageSize,
            imageQuality,
            imageStyle,
            personas,
            quickSettings,
            streamResponse,
            speechLanguage,
            userAvatar
        } = storeToRefs(settingsStore);
        const teamsStore = useTeamsStore();
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

        // Avatar related
        const avatarImage = ref(null);
        const avatarPicker = ref(null);

        // Opens the avatar picker dialog
        const handleAvatarPicker = () => {
            avatarPicker.value.pickFiles();
        }
        // Converts image from the avatar picker dialog to base64 and stores it as user avatar
        const handleAvatarSelected = () => {
            if (avatarImage.value) {
                const reader = new FileReader();
                reader.onload = () => userAvatar.value = reader.result;
                reader.readAsDataURL(avatarImage.value);
            }
        }

        return {
            t,
            locale,
            availableLocales,
            speechLanguage,
            appMode,
            darkMode,
            conversationMode,
            chatDirection,
            apiKey,
            model,
            modelOptions,
            maxTokens,
            temperature,
            choices,
            imageSize,
            imageSizeValue,
            imageQuality,
            imageQualityValue,
            imageStyle,
            imageStyleValue,
            personaOptions,
            personaFilterFn,
            personas,
            userAvatar,
            handleAvatarPicker,
            handleAvatarSelected,
            avatarPicker,
            avatarImage,
            showActionButton: ref(false),
            quickSettings,
            streamResponse,

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>
