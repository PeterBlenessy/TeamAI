<template>
    <q-list>
        <q-item>
            <q-item-section avatar>
                <q-icon :name="mdiCompare" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.general.darkMode.label') }}</q-item-label>
                <q-item-label caption>{{ t('settings.general.darkMode.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle v-model="darkMode" toggle-indeterminate indeterminate-value='auto' flat dense round />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.darkMode.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="mdiTranslate" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.general.locale.label') }}</q-item-label>
                <q-item-label caption>{{ t('settings.general.locale.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-select :option-label="(item) => t('locale.' + item)" v-model="locale"
                    :options="availableLocales" dense options-dense />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.locale.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="mdiMicrophoneMessage" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.general.speech.label') }}</q-item-label>
                <q-item-label caption>{{ t('settings.general.speech.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-select v-model="speechLanguage" dense options-dense :options="availableLocales"
                    :option-label="(item) => t('locale.' + item)" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.speech.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="chatDirection == 'up' ? mdiTransferUp : mdiTransferDown" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ $t('settings.general.chatDirection.label') }}</q-item-label>
                <q-item-label caption>{{ $t('settings.general.chatDirection.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle v-model="chatDirection" flat dense round false-value="up" true-value="down" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.chatDirection.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="conversationMode ? mdiForum : mdiMessageOutline" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ $t('settings.general.conversationMode.label') }}</q-item-label>
                <q-item-label caption>{{ $t('settings.general.conversationMode.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle v-model="conversationMode" flat dense round />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.conversationMode.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="appMode == 'basic' ? mdiAccount : mdiAccountGroup" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ $t('settings.general.appMode.label') }}</q-item-label>
                <q-item-label caption>{{ $t('settings.general.appMode.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle v-model="appMode" dense false-value="basic" true-value="advanced" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.appMode.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="quickSettings == true ? mdiCogs : mdiCogOff" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ $t('settings.general.quickSettings.label') }}</q-item-label>
                <q-item-label caption>{{ $t('settings.general.quickSettings.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle v-model="quickSettings" dense :toggle-indeterminate="false" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.quickSettings.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="mdiSetSplit" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ $t('settings.general.streamResponse.label') }}</q-item-label>
                <q-item-label caption>{{ $t('settings.general.streamResponse.caption') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle v-model="streamResponse" dense :toggle-indeterminate="false" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.general.streamResponse.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>
    </q-list>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { mdiCompare, mdiTranslate, mdiMicrophoneMessage, mdiTransferUp, mdiTransferDown, mdiForum, 
    mdiMessageOutline, mdiAccount, mdiAccountGroup, mdiCogs, mdiCogOff, mdiSetSplit 
} from '@quasar/extras/mdi-v7';
import { useSettingsStore } from '@/stores/settings-store.js';

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
} = storeToRefs(settingsStore);

const iconColor = computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8');
</script>
