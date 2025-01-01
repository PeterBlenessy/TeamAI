<template>
    <q-card style="min-width: 750px; max-width: 750px;">
        <q-card-section>
            <UserAvatarSettings />
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
            </q-tab-panels>
        </q-card-section>
    </q-card>
</template>

<script>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

import UserAvatarSettings from './UserAvatarSettings.vue';
import GeneralSettings from './GeneralSettings.vue';
import ProviderSettings from "./ProviderSettings.vue";
import TextGenerationSettings from "./TextGenerationSettings.vue";
import ImageGenerationSettings from "./ImageGenerationSettings.vue";
import CloudSyncSettings from './CloudSyncSettings.vue';

export default {
    name: "AppSettings",
    components: {
        UserAvatarSettings,
        GeneralSettings,
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
        const { t } = useI18n();
        const tab = ref(props.initialTab);

        return {
            t,
            tab,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    },
}
</script>