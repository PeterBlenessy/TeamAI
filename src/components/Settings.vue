<template>
    <q-card style="min-width: 30%; max-width: 90%;">
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
                            <q-btn class="absolute-bottom" size="sm" icon="mdi-swap-horizontal"
                                v-show="showActionButton" />
                        </q-img>
                        <q-icon v-else name="mdi-account-circle" size="xl" :color="iconColor"
                            @mouseover="showActionButton = true" @mouseleave="showActionButton = false">
                            <q-btn class="absolute-bottom" size="sm" icon="mdi-plus-circle" v-show="showActionButton" />
                        </q-icon>
                        <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.avatar.tooltip') }}
                        </q-tooltip>
                    </q-avatar>
                </q-item-section>
            </q-item>
        </q-card-section>

        <q-separator />

        <q-card-section>

            <q-tabs v-model="tab" dense active-color="primary" indicator-color="primary" no-caps mobile-arrows outside-arrows>
                <q-tab name="general" icon="mdi-cog-outline" :label="t('settings.general.label')" />
                <q-tab name="api" icon="mdi-web" :label="t('settings.api.label')" />
                <q-tab name="text" icon="mdi-tooltip-text" :label="t('settings.text.label')" />
                <q-tab name="image" icon="mdi-tooltip-image" :label="t('settings.image.label')" />
                <q-tab name="cloudSync" icon="mdi-cloud-sync" :label="t('settings.cloud.label')" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab">

                <!-- General application settings -->
                <q-tab-panel name="general">
                    <q-list>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="mdi-compare" :color="iconColor" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ t('settings.general.darkMode.label') }}</q-item-label>
                                <q-item-label caption>{{ t('settings.general.darkMode.caption') }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-toggle v-model="darkMode" toggle-indeterminate indeterminate-value='auto' flat dense
                                    round />
                                <q-tooltip :delay="750" max-width="300px" transition-show="scale"
                                    transition-hide="scale">
                                    {{ t('settings.general.darkMode.tooltip') }}
                                </q-tooltip>

                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="mdi-translate" :color="iconColor" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ t('settings.general.locale.label') }}</q-item-label>
                                <q-item-label caption>{{ t('settings.general.locale.caption') }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-select :option-label="(item) => t('locale.' + item)" v-model="locale"
                                    :options="availableLocales" dense options-dense />
                                <q-tooltip :delay="750" max-width="300px" transition-show="scale"
                                    transition-hide="scale">
                                    {{ t('settings.general.locale.tooltip') }}
                                </q-tooltip>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="mdi-microphone-message" :color="iconColor" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ t('settings.general.speech.label') }}</q-item-label>
                                <q-item-label caption>{{ t('settings.general.speech.caption') }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>

                                <q-select v-model="speechLanguage" dense options-dense :options="availableLocales"
                                    :option-label="(item) => t('locale.' + item)" />
                                <q-tooltip :delay="750" max-width="300px" transition-show="scale"
                                    transition-hide="scale">
                                    {{ t('settings.general.speech.tooltip') }}
                                </q-tooltip>
                            </q-item-section>
                        </q-item>

                        <!-- User experience related settings -->
                        <q-item>
                            <q-item-section avatar>
                                <q-icon :name="chatDirection == 'up' ? 'mdi-transfer-up' : 'mdi-transfer-down'"
                                    :color="iconColor" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ $t('settings.general.chatDirection.label') }}</q-item-label>
                                <q-item-label caption>{{ $t('settings.general.chatDirection.caption') }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-toggle v-model="chatDirection" flat dense round false-value="up" true-value="down" />
                                <q-tooltip :delay="750" max-width="300px" transition-show="scale"
                                    transition-hide="scale">
                                    {{ t('settings.general.chatDirection.tooltip') }}
                                </q-tooltip>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon :name="conversationMode ? 'mdi-forum-outline' : 'mdi-message-outline'"
                                    :color="iconColor" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ $t('settings.general.conversationMode.label') }}</q-item-label>
                                <q-item-label caption>{{ $t('settings.general.conversationMode.caption')
                                    }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-toggle v-model="conversationMode" flat dense round />
                                <q-tooltip :delay="750" max-width="300px" transition-show="scale"
                                    transition-hide="scale">
                                    {{ t('settings.general.conversationMode.tooltip') }}
                                </q-tooltip>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon :name="appMode == 'basic' ? 'mdi-account' : 'mdi-account-group'"
                                    :color="iconColor" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ $t('settings.general.appMode.label') }}</q-item-label>
                                <q-item-label caption>{{ $t('settings.general.appMode.caption') }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-toggle v-model="appMode" dense false-value="basic" true-value="advanced" />
                                <q-tooltip :delay="750" max-width="300px" transition-show="scale"
                                    transition-hide="scale">
                                    {{ t('settings.general.appMode.tooltip') }}
                                </q-tooltip>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon :name="quickSettings == true ? 'mdi-cogs' : 'mdi-cog-off'" :color="iconColor" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ $t('settings.general.quickSettings.label') }}</q-item-label>
                                <q-item-label caption>{{ $t('settings.general.quickSettings.caption') }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-toggle v-model="quickSettings" dense :toggle-indeterminate="false" />
                                <q-tooltip :delay="750" max-width="300px" transition-show="scale"
                                    transition-hide="scale">
                                    {{ t('settings.general.quickSettings.tooltip') }}
                                </q-tooltip>
                            </q-item-section>
                        </q-item>

                        <q-item>
                            <q-item-section avatar>
                                <q-icon name="mdi-set-split" :color="iconColor" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ $t('settings.general.streamResponse.label') }}</q-item-label>
                                <q-item-label caption>{{ $t('settings.general.streamResponse.caption') }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-toggle v-model="streamResponse" dense :toggle-indeterminate="false" />
                                <q-tooltip :delay="750" max-width="300px" transition-show="scale"
                                    transition-hide="scale">
                                    {{ t('settings.general.streamResponse.tooltip') }}
                                </q-tooltip>
                            </q-item-section>
                        </q-item>

                    </q-list>
                </q-tab-panel>

                <!-- API Provider settings -->
                <q-tab-panel name="api">
                    <ProviderSettings />
                </q-tab-panel>

                <!-- Text generation settings -->
                <q-tab-panel name="text">
                    <TextGenerationSettings />
                </q-tab-panel>

                <!-- Image generation settings -->
                <q-tab-panel name="image">
                    <ImageGenerationSettings />
                </q-tab-panel>

                <!-- Cloud sync settings -->
                <q-tab-panel name="cloudSync">
                    <CloudSyncSettings />
                </q-tab-panel>
            </q-tab-panels>
        </q-card-section>
    </q-card>
</template>

<script>
import { computed, ref } from 'vue';
import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

import ProviderSettings from "./ProviderSettings.vue";
import TextGenerationSettings from "./TextGenerationSettings.vue";
import ImageGenerationSettings from "./ImageGenerationSettings.vue";
import CloudSyncSettings from './CloudSyncSettings.vue';

export default {
    name: "AppSettings",
    components: {
        ProviderSettings,
        TextGenerationSettings,
        ImageGenerationSettings,
        CloudSyncSettings
    },

    props: {
        initialTab: {
            type: String,
            default: 'general'
        }
    },

    setup(props) {
        const $q = useQuasar();
        const { t, locale, availableLocales } = useI18n();
        const settingsStore = useSettingsStore();
        const {
            appMode,
            darkMode,
            conversationMode,
            chatDirection, 
            quickSettings,
            streamResponse,
            speechLanguage,
            userAvatar
        } = storeToRefs(settingsStore);

        // Use the initialTab prop for the tab's initial value
        const tab = ref(props.initialTab);

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
            tab,
            speechLanguage,
            appMode,
            darkMode,
            conversationMode,
            chatDirection,

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