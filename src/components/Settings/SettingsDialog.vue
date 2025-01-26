<template>
    <q-card style="min-width: 750px; max-width: 750px;">
        <q-card-section>
            <UserAvatarSettings />
        </q-card-section>

        <q-separator />

        <q-card-section>

            <q-tabs v-model="tab" dense active-color="primary" indicator-color="primary" no-caps mobile-arrows outside-arrows>
                <q-tab name="general" :icon="mdiCogOutline" :label="t('settings.general.label')" />
                <q-tab name="api" :icon="mdiWeb" :label="t('settings.api.label')" />
                <q-tab name="text" :icon="mdiTooltipText" :label="t('settings.text.label')" />
                <q-tab name="image" :icon="mdiTooltipImage" :label="t('settings.image.label')" />
                <q-tab name="cloudSync" :icon="mdiCloudSync" :label="t('settings.cloud.label')" />
                <q-tab name="advanced" :icon="mdiCogBox" :label="t('settings.advanced.label')" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab">

                <!-- General application settings -->
                <q-tab-panel name="general">
                    <GeneralSettings />
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

                <!-- Advanced settings -->
                <q-tab-panel name="advanced">
                    <AdvancedSettings />
                </q-tab-panel>
            </q-tab-panels>
        </q-card-section>
    </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useHelpers } from '@/composables/useHelpers';
import { mdiCogOutline, mdiWeb, mdiTooltipText, mdiTooltipImage, mdiCloudSync, mdiCogBox } from '@quasar/extras/mdi-v7';
import UserAvatarSettings from '@/components/Settings/UserAvatarSettings.vue';
import GeneralSettings from '@/components/Settings/GeneralSettings.vue';
import ProviderSettings from "@/components/Settings/ProviderSettings.vue";
import TextGenerationSettings from "@/components/Settings/TextGenerationSettings.vue";
import ImageGenerationSettings from "@/components/Settings/ImageGenerationSettings.vue";
import CloudSyncSettings from '@/components/Settings/CloudSyncSettings.vue';
import AdvancedSettings from '@/components/Settings/AdvancedSettings.vue';

const props = defineProps({
    initialTab: {
        type: String,
        default: 'general'
    }
});

const $q = useQuasar();
const { t } = useI18n();
const tab = ref(props.initialTab);

const { iconColor } = useHelpers();
</script>
