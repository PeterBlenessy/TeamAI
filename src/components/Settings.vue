<template>
    <q-card style="min-width: 50%; max-width: 60%">
        <q-card-section>
            <q-item>
                <q-item-section>
                    <div class="text-h6">
                        {{ t('settings.title') }}
                    </div>
                </q-item-section>
                <q-item-section avatar>
                    <q-file ref="avatarPicker" v-model="avatarImage" @update:model-value="handleAvatarSelected()"
                        accept=".png, .jpg, .jpeg, .svg" style="display:none" />

                    <q-avatar color="primary" size="xl" @click="handleAvatarPicker()">
                        <q-icon v-if="!userAvatar" name="mdi-account" />
                        <img v-else :src="userAvatar" />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.avatar.tooltip') }}
                        </q-tooltip>
                    </q-avatar>
                </q-item-section>
            </q-item>
        </q-card-section>

        <q-separator />

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
                        <q-icon name="chat" :color="iconColor" />
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

                <q-separator v-if="appMode == 'advanced'" />

                <q-item v-if="appMode == 'advanced'">
                    <q-item-section avatar>
                        <q-icon name="mdi-card-account-details-outline" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ t('settings.persona.label') }}</q-item-label>
                        <q-item-label caption>{{ $t('settings.persona.caption') }}</q-item-label>
                        <q-select dense options-dense use-input input-debounce="0"
                            :option-label="(item) => item === null ? 'Null value' : item.name" v-model="persona"
                            :options="personaOptions" @filter="personaFilterFn" />

                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ persona.prompt }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-separator />

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="key" :color="iconColor" />
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

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="model_training" :color="iconColor" />
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
                        <q-icon name="short_text" :color="iconColor" />
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
                        <q-icon name="thermostat" :color="iconColor" />
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

                <q-item>
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
            modelOptions,
            maxTokens,
            temperature,
            choices,
            imageSize,
            persona,
            speechLanguage,
            userAvatar
        } = storeToRefs(settingsStore);
        const teamsStore = useTeamsStore();
        const { personas } = teamsStore;
        const personaOptions = ref(personas);

        // Filters personas based on input characters in the select box
        function personaFilterFn(val, update) {
            if (val === '') {
                update(() => {
                    personaOptions.value = personas;
                });
                return;
            }

            update(() => {
                const needle = val.toLowerCase();
                personaOptions.value = personas.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
            });
        }

        const imageSizeOptions = ref(['256x256', '512x512', '1024x1024']);
        const imageSizeValue = ref(imageSizeOptions.value.indexOf(imageSize.value));

        watch(imageSizeValue, () => {
            imageSize.value = imageSizeOptions.value[imageSizeValue.value];
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
            imageSizeOptions,
            persona,
            personaOptions,
            personaFilterFn,
            userAvatar,
            handleAvatarPicker,
            handleAvatarSelected,
            avatarPicker,
            avatarImage,

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>
