<template>
    <q-card style="min-width: 50%; max-width: 60%">
        <q-card-section>
            <div class="text-h6">
                {{ t('settings.title') }}
            </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
            <q-list>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="language" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ t('settings.locale.label') }}</q-item-label>
                        <q-item-label caption>{{ t('settings.locale.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>

                        <q-select v-model="locale" :options="availableLocales" dense options-dense />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.locale.tooltip') }}
                        </q-tooltip>
                    </q-item-section>
                </q-item>

                <q-item>
                    <q-item-section avatar>
                        <q-icon name="dark_mode" :color="iconColor" />
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

                <q-separator />

                <q-item>
                    <q-item-section avatar>
                        <q-icon :name="chatDirection=='up' ? 'mdi-transfer-up' : 'mdi-transfer-down'" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>{{ $t('settings.chatDirection.label') }}</q-item-label>
                        <q-item-label caption>{{ $t('settings.chatDirection.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-toggle v-model="chatDirection" flat dense round false-value="up" true-value="down"/>
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
                        <q-icon :name="appMode=='basic' ? 'mdi-account' : 'mdi-account-group'" :color="iconColor" />
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
                        <q-icon name="alt_route" :color="iconColor" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label caption>{{ t('settings.openAI.choices.label') }} ({{ choices }})</q-item-label>
                        <q-slider :model-value="choices" @change="val => { choices = val }" snap :min="1" :max="4" :step="1"
                            :markers="1" label />
                        <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.openAI.choices.tooltip') }}
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

            </q-list>
        </q-card-section>
    </q-card>
</template>

<script>
import { computed } from 'vue';
import { useSettingsStore } from '../stores/settings-store.js';
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
            choices,
            temperature
        } = storeToRefs(settingsStore);

        return {
            t,
            locale,
            availableLocales,
            appMode,
            darkMode,
            conversationMode,
            chatDirection,
            apiKey,
            model,
            modelOptions,
            maxTokens,
            choices,
            temperature,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>
