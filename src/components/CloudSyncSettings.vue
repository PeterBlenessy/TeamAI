<template>
    <q-list>
        <!-- Cloud Sync Toggle -->
        <q-item>
            <q-item-section avatar>
                <q-icon name="mdi-cloud-sync" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.cloud.sync.label') }}</q-item-label>
                <q-item-label caption>
                    {{ isMacOS ? t('settings.cloud.sync.caption') : t('settings.cloud.sync.unavailable') }}
                </q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle
                    v-model="cloudSync"
                    :disable="!isMacOS"
                    flat
                    dense
                    round
                />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.cloud.sync.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <!-- Cloud Provider Selection -->
        <q-item>
            <q-item-section avatar>
                <q-icon name="mdi-cloud" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-select
                    v-model="cloudProvider"
                    :options="['iCloud']"
                    :label="t('settings.cloud.provider.label')"
                    :disable="!isMacOS || !cloudSync"
                    :hint="isMacOS ? t('settings.cloud.provider.hint') : t('settings.cloud.provider.unavailable')"
                    dense
                    options-dense
                />
            </q-item-section>
            <q-item-section side>
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.cloud.provider.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-separator spaced />

        <!-- Sync Options Header -->
        <q-item>
            <q-item-section>
                <q-item-label>{{ t('settings.cloud.options.label') }}</q-item-label>
                <q-item-label caption>{{ t('settings.cloud.options.caption') }}</q-item-label>
            </q-item-section>
        </q-item>

        <!-- Settings Sync Option -->
        <q-item tag="label">
            <q-item-section avatar>
                <q-icon name="mdi-cog-sync" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.cloud.options.settings') }}</q-item-label>
                <q-item-label caption>
                    {{ t('settings.cloud.options.settingsCaption') }}
                </q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle
                    v-model="syncOptions.settings"
                    :disable="!isMacOS || !cloudSync"
                    flat
                    dense
                    round
                />
            </q-item-section>
        </q-item>

        <!-- Personas Sync Option -->
        <q-item tag="label">
            <q-item-section avatar>
                <q-icon name="mdi-account-sync" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.cloud.options.personas') }}</q-item-label>
                <q-item-label caption>
                    {{ t('settings.cloud.options.personasCaption') }}
                </q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle
                    v-model="syncOptions.personas"
                    :disable="!isMacOS || !cloudSync"
                    flat
                    dense
                    round
                />
            </q-item-section>
        </q-item>

        <!-- Conversations Sync Option -->
        <q-item tag="label">
            <q-item-section avatar>
                <q-icon name="mdi-message-text-clock" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.cloud.options.conversations') }}</q-item-label>
                <q-item-label caption>
                    {{ t('settings.cloud.options.conversationsCaption') }}
                </q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle
                    v-model="syncOptions.conversations"
                    :disable="!isMacOS || !cloudSync"
                    flat
                    dense
                    round
                />
            </q-item-section>
        </q-item>

        <!-- Last Sync Info -->
        <q-item v-if="cloudSync && lastSync">
            <q-item-section avatar>
                <q-icon name="mdi-clock-outline" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.cloud.lastSync.label') }}</q-item-label>
                <q-item-label caption>
                    {{ t('settings.cloud.lastSync.caption', { date: new Date(lastSync).toLocaleString() }) }}
                </q-item-label>
            </q-item-section>
        </q-item>
    </q-list>
</template>

<script>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../stores/settings-store';
import { platform } from '@tauri-apps/plugin-os';
import { useQuasar } from 'quasar';

export default {
    name: 'CloudSync',
    setup() {
        const { t } = useI18n();
        const $q = useQuasar();
        const settingsStore = useSettingsStore();
        const { cloudSync, cloudProvider, lastSync, syncOptions } = storeToRefs(settingsStore);

        const isMacOS = computed(() => platform() === 'macos');

        return {
            t,
            cloudSync,
            cloudProvider,
            lastSync,
            syncOptions,
            isMacOS,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        };
    }
};
</script> 