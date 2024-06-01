<template>
    <div>
        <q-list>
            <q-item>
                <q-item-section avatar>
                    <q-icon name="mdi-api" :color="iconColor" />
                </q-item-section>
                <q-item-section>
                    <!-- <q-item-label>{{ t('settings.provider.label') }}</q-item-label> -->
                    <q-select v-model="defaultProvider" :options="apiProviderOptions" dense options-dense
                        :disable="showProviderForm" />
                    <!-- <q-item-label caption>{{ t('settings.provider.caption') }}</q-item-label> -->
                    <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                        {{ t('settings.provider.tooltip') }}
                    </q-tooltip>
                </q-item-section>
            </q-item>

            <q-item>
                <q-item-section avatar></q-item-section>
                <q-item-section side>
                    <q-space />
                    <!-- Action buttons: Edit | New | Delete -->
                    <div class="q-gutter-sm" v-if="!showProviderForm">
                        <q-btn size="sm" style="width: 90px" padding="xs" icon="mdi-pencil"
                            :label="t('settings.provider.edit.buttonLabel')"
                            :color="editProvider ? 'primary' : 'grey-14'" @click="handleEditProvider()">
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ t('settings.provider.edit.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn size="sm" style="width: 90px" padding="xs" icon="mdi-plus"
                            :label="t('settings.provider.new.buttonLabel')" :color="addProvider ? 'primary' : 'grey-14'"
                            @click="handleAddNewProvider()">
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ t('settings.provider.new.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn size="sm" style="width: 90px" padding="xs" icon="mdi-delete-outline"
                            :label="t('settings.provider.delete.buttonLabel')" color="grey-14"
                            @click="handleDeleteProvider()">
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ t('settings.provider.delete.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                    </div>
                    <!-- Action buttons: Save | Cancel -->
                    <div class="q-gutter-sm" v-if="showProviderForm">
                        <q-btn size="sm" style="width: 90px" padding="xs" icon="mdi-content-save" label="Save"
                            color="primary" @click="handleSaveProvider()" />
                        <q-btn size="sm" style="width: 90px" padding="xs" icon="mdi-close-box-outline" label="Cancel"
                            color="grey-14" @click="handleCancel()" />
                    </div>

                </q-item-section>
            </q-item>

            <div v-if="showProviderForm">

                <q-item>
                    <q-item-section avatar>
                        <q-icon size="lg" :name="editProvider ? 'mdi-pencil-circle' : 'mdi-plus-circle'"
                            color="primary" />
                    </q-item-section>
                    <q-item-section>
                        <!-- <q-item-label>{{ editProvider ? t('settings.provider.edit.label') : t('settings.provider.new.label') }}</q-item-label> -->
                        <q-item-label class="text-subtitle2">{{ editProvider ? t('settings.provider.edit.caption') :
                        t('settings.provider.new.caption') }}</q-item-label>

                        <q-input :model-value="tmpProvider.name" @change="val => { tmpProvider.name = val }"
                            :label="t('settings.provider.name.label')"
                            :placeholder="t('settings.provider.name.placeholder')">
                            <template v-slot:prepend>
                                <q-icon size="xs" name="mdi-tag" />
                            </template>
                        </q-input>

                        <q-input :model-value="tmpProvider.baseUrl" @change="val => { tmpProvider.baseUrl = val }"
                            :label="t('settings.provider.baseUrl.label')"
                            :placeholder="t('settings.provider.baseUrl.placeholder')">
                            <template v-slot:prepend>
                                <q-icon size="xs" name="mdi-web" />
                            </template>
                        </q-input>
                        <q-input :model-value="tmpProvider.apiKey" @change="val => { tmpProvider.apiKey = val }"
                            :type="isPwd ? 'password' : 'text'" :label="t('settings.provider.apiKey.label')"
                            :placeholder="t('settings.provider.apiKey.placeholder')">
                            <template v-slot:prepend>
                                <q-icon size="xs" name="mdi-key" />
                            </template>
                            <template v-slot:append>
                                <q-icon :name="isPwd ? 'mdi-eye-off' : 'mdi-eye'" class="cursor-pointer"
                                    @click="isPwd = !isPwd" />
                            </template>
                        </q-input>

                        <q-select v-model="tmpProvider.models" new-value-mode="add-unique" use-chips use-input multiple
                            hide-dropdown-icon input-debounce="0">
                            <template v-slot:prepend>
                                <q-icon size="xs" name="mdi-brain" />
                            </template>
                        </q-select>
                    </q-item-section>
                </q-item>

            </div>

        </q-list>
    </div>
</template>

<script>

import { computed, ref } from 'vue';
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../stores/settings-store.js';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import defaultProviders from '../services/providers.config.json';

export default {
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const settingsStore = useSettingsStore();
        const { defaultProvider, apiProviders, apiKey } = storeToRefs(settingsStore);

        // Check if apiProviders is empty and populate from defaultProviders
        if (apiProviders.value.length === 0) {
            apiProviders.value = defaultProviders;
        }

        // Array of api providers to be used in select options
        const apiProviderOptions = computed(() => apiProviders.value.map(provider => provider.name));

        // Temporary provider object to store changes temporarilly and avoid changing the original values
        const tmpProvider = ref({});

        // Which action is being performed
        const editProvider = ref(false);
        const addProvider = ref(false);

        return {
            t,

            defaultProvider,
            apiProviderOptions,
            tmpProvider,

            // TODO: remove when provider implementation done
            apiKey,

            addProvider,
            editProvider,
            showProviderForm: computed(() => editProvider.value || addProvider.value),

            // Show/hide password
            isPwd: ref(true),

            handleEditProvider: () => {
                const foundProvider = apiProviders.value.find(provider => provider.name === defaultProvider.value);
                // Deep-copy the found provider, to include nested objects and not risk changing the original values
                tmpProvider.value = JSON.parse(JSON.stringify(foundProvider));
                editProvider.value = true;
            },

            handleAddNewProvider: () => {
                tmpProvider.value = { name: '', baseUrl: '', apiKey: '' };
                addProvider.value = true;
            },

            handleDeleteProvider: () => {
                const index = apiProviders.value.findIndex(provider => provider.name === defaultProvider.value);
                if (index !== -1 && apiProviders.value[index].deletable !== false) {
                    apiProviders.value.splice(index, 1);
                    defaultProvider.value = apiProviders.value[0].name;
                }
            },

            handleSaveProvider: () => {

                // Check for '' values
                if (tmpProvider.value.name === '' || tmpProvider.value.baseUrl === '' || tmpProvider.value.apiKey === '') {
                    console.error('Empty values');
                    return;
                }

                if (editProvider.value == true) {
                    const index = apiProviders.value.findIndex(provider => provider.name === defaultProvider.value);

                    if (index !== -1) { // Provider found
                        apiProviders.value[index] = { ...tmpProvider.value };
                        // If the provider name is changed, re-select it
                        defaultProvider.value = tmpProvider.value.name;
                        editProvider.value = false;
                    } else {
                        console.error('Provider not found');
                    }
                } else if (addProvider.value == true) {
                    const index = apiProviders.value.findIndex(provider => provider.name === tmpProvider.value.name);

                    if (index === -1) { // Provider does not exist
                        apiProviders.value.push({ ...tmpProvider.value });
                        // We leave selecting the new provider to the user
                        addProvider.value = false;
                    } else { // Provider already exists
                        // Notify the user
                        console.error('Provider already exists');
                        return;
                    }
                }

                tmpProvider.value = {};
            },

            handleCancel: () => {
                addProvider.value = false;
                editProvider.value = false;
                tmpProvider.value = {};
            },

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style scoped>
/* Your component styles here */
</style>