<template>
    <q-list>
        <!-- Cloud Sync Toggle -->
        <q-item>
            <q-item-section avatar>
                <q-icon :name="mdiCloudSync" :color="iconColor" />
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
                <q-icon :name="mdiCloud" :color="iconColor" />
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

        <!-- Personas Sync Option -->
        <q-item>
            <q-item-section avatar>
                <q-icon :name="mdiAccountSync" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.cloud.options.personas.label') }}</q-item-label>
                <q-item-label caption>
                    {{ t('settings.cloud.options.personas.caption') }}
                </q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-toggle
                    v-model="syncOptions.personas"
                    :disable="!isMacOS || !cloudSync"
                    flat
                    dense
                    round
                >
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.cloud.options.personas.tooltip') }}
                </q-tooltip>

                </q-toggle>
            </q-item-section>
        </q-item>

            <!-- Conversations Sync Option -->
            <q-item>
                <q-item-section avatar>
                    <q-icon :name="mdiMessageTextClock" :color="iconColor" />
                </q-item-section>
                <q-item-section>
                    <q-item-label>{{ t('settings.cloud.options.conversations.label') }}</q-item-label>
                    <q-item-label caption>
                        {{ t('settings.cloud.options.conversations.caption') }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-toggle
                        v-model="syncOptions.conversations"
                        :disable="!isMacOS || !cloudSync"
                        flat
                        dense
                        round
                    >
                        <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.cloud.options.conversations.tooltip') }}
                        </q-tooltip>
                    </q-toggle>

                </q-item-section>
            </q-item>

            <!-- Images Sync Option -->
            <q-item>
                <q-item-section avatar>
                    <q-icon :name="mdiImage" :color="iconColor" />
                </q-item-section>
                <q-item-section>
                    <q-item-label>{{ t('settings.cloud.options.images.label') }}</q-item-label>
                    <q-item-label caption>
                        {{ t('settings.cloud.options.images.caption') }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-toggle
                        v-model="syncOptions.images"
                        :disable="!isMacOS || !cloudSync"
                        flat
                        dense
                        round
                    >
                        <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                            {{ t('settings.cloud.options.images.tooltip') }}
                        </q-tooltip>
                    </q-toggle>
                </q-item-section>
            </q-item>

        <q-separator spaced />

        <!-- Last Sync Info -->
        <q-item v-if="cloudSync && lastSync">
            <q-item-section avatar>
                <q-icon :name="mdiClockOutline" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.cloud.lastSync.label') }}</q-item-label>
                <q-item-label caption>
                    {{ t('settings.cloud.lastSync.caption', { date: new Date(lastSync).toLocaleString() }) }}
                </q-item-label>
            </q-item-section>
            <q-item-section side>
                <q-btn
                    dense flat
                    round
                    :icon="syncing ? mdiSyncAlert : mdiSync"
                    :loading="syncing"
                    :disable="!isMacOS || !cloudSync"
                    @click="handleSync"
                >
                    <q-tooltip>{{ t('settings.cloud.syncNow') }}</q-tooltip>
                </q-btn>
            </q-item-section>
        </q-item>
    </q-list>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHelpers } from '@/composables/useHelpers';
import { platform } from '@tauri-apps/plugin-os';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings-store';
import { useSyncStore } from '@/stores/sync-store';
import { useCloudSync } from '@/composables/useCloudSync';
import { 
    mdiCloudSync,
    mdiCloud,
    mdiAccountSync,
    mdiMessageTextClock,
    mdiClockOutline,
    mdiSync,
    mdiSyncAlert,
    mdiImage
} from '@quasar/extras/mdi-v7';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const { cloudSync, cloudProvider, syncOptions } = storeToRefs(settingsStore);

const syncStore = useSyncStore();
const { lastSync } = storeToRefs(syncStore);
const { syncing, syncToCloud } = useCloudSync();

const isMacOS = computed(() => platform() === 'macos');
const { iconColor } = useHelpers();

const handleSync = () => syncToCloud();

</script>
