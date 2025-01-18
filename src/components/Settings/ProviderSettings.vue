<template>
    <div>
        <q-list>
            <q-item>
                <q-item-section avatar>
                    <q-icon :name="mdiApi" :color="iconColor" />
                </q-item-section>
                <q-item-section>
                    <q-select
                        v-model="defaultProvider"
                        :options="apiProviderOptions" 
                        :disable="showProviderForm"
                    >
                        <template v-slot:prepend>
                            <q-avatar rounded>
                                <img :src="selectedProviderLogo" alt="Logo" width="24" height="24" />
                            </q-avatar>
                        </template>
                        <template v-slot:append>
                            <div class="row items-center full-width">
                                <template v-if="isOllamaProvider(defaultProvider)">
                                    <!-- Not running -->
                                    <q-btn v-if="!isOllamaRunning" 
                                        flat dense size="sm"
                                        :icon="mdiDownload" 
                                        color="warning"
                                        :loading="isDownloadingOllama"
                                        @click.stop.prevent="handleDownloadOllama"
                                    >
                                        <q-tooltip>Download and install Ollama</q-tooltip>
                                    </q-btn>
                                    
                                    <!-- Running but needs configuration -->
                                    <q-btn v-else-if="!isOllamaConfigured"
                                        flat dense size="sm" 
                                        :icon="mdiRestart"
                                        color="warning"
                                        :loading="restartingOllama"
                                        @click.stop.prevent="configureAndRestartOllama"
                                    >
                                        <q-tooltip>Configuration needed</q-tooltip>
                                    </q-btn>
                                    
                                    <!-- Running correctly -->
                                    <q-icon v-else
                                        :name="mdiCircle"
                                        color="positive"
                                        size="xs">
                                        <q-tooltip>Ollama running</q-tooltip>
                                    </q-icon>
                                </template>
                            </div>
                        </template>
                        <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps">
                                <q-item-section avatar>
                                    <img :src="scope.opt.logo" alt="Logo" width="24" height="24" />
                                </q-item-section>
                                <q-item-section>
                                    {{ scope.opt.label }}
                                </q-item-section>
                            </q-item>
                        </template>
                    </q-select>
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
                        <q-btn size="sm" style="width: 90px" padding="xs" :icon="mdiPencil"
                            :label="t('settings.provider.edit.buttonLabel')"
                            :color="editProvider ? 'primary' : 'grey-14'" @click="handleEditProvider()">
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ t('settings.provider.edit.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn size="sm" style="width: 90px" padding="xs" :icon="mdiPlus"
                            :label="t('settings.provider.new.buttonLabel')" :color="addProvider ? 'primary' : 'grey-14'"
                            @click="handleAddNewProvider()">
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ t('settings.provider.new.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn size="sm" style="width: 90px" padding="xs" :icon="mdiDeleteOutline"
                            :label="t('settings.provider.delete.buttonLabel')" color="grey-14"
                            @click="handleDeleteProvider()">
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ t('settings.provider.delete.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                        <q-btn v-if="isOllamaProvider(defaultProvider)"
                            size="sm" style="min-width: 90px" padding="xs" 
                            :icon="mdiCreation"
                            :icon-right="showModelManager ? mdiChevronUp : mdiChevronDown"
                            :label="t('settings.provider.models.buttonLabel')"
                            :color="showModelManager ? 'primary' : 'grey-14'"
                            @click="showModelManager = !showModelManager"
                        >
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ t('settings.provider.models.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                    </div>
                    <!-- Action buttons: Save | Cancel -->
                    <div class="q-gutter-sm" v-if="showProviderForm">
                        <q-btn size="sm" style="width: 90px" padding="xs" :icon="mdiContentSave" label="Save"
                            color="primary" @click="handleSaveProvider()" />
                        <q-btn size="sm" style="width: 90px" padding="xs" :icon="mdiCloseBoxOutline" label="Cancel"
                            color="grey-14" @click="handleCancel()" />
                    </div>

                </q-item-section>
            </q-item>

            <div v-if="showProviderForm">

                <q-item>
                    <q-item-section avatar>
                        <q-icon size="lg" :name="editProvider ? mdiPencilCircle : mdiPlusCircle"
                            color="primary" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label class="text-subtitle2">{{ editProvider ? t('settings.provider.edit.caption') :
                        t('settings.provider.new.caption') }}</q-item-label>

                        <q-input :model-value="tmpProvider.name" @change="val => { tmpProvider.name = val }"
                            :label="t('settings.provider.name.label')"
                            :placeholder="t('settings.provider.name.placeholder')">
                            <template v-slot:prepend>
                                <q-icon size="xs" :name="mdiTag" />
                            </template>
                        </q-input>

                        <q-input :model-value="tmpProvider.baseUrl" @change="val => { tmpProvider.baseUrl = val }"
                            :label="t('settings.provider.baseUrl.label')"
                            :placeholder="t('settings.provider.baseUrl.placeholder')">
                            <template v-slot:prepend>
                                <q-icon size="xs" :name="mdiWeb" />
                            </template>
                        </q-input>
                        <q-input :model-value="tmpProvider.apiKey" @change="val => { tmpProvider.apiKey = val }"
                            :type="isPwd ? 'password' : 'text'" :label="t('settings.provider.apiKey.label')"
                            :placeholder="t('settings.provider.apiKey.placeholder')">
                            <template v-slot:prepend>
                                <q-icon size="xs" :name="mdiKey" />
                            </template>
                            <template v-slot:append>
                                <q-icon :name="isPwd ? mdiEyeOff : mdiEye" class="cursor-pointer"
                                    @click="isPwd = !isPwd" />
                            </template>
                        </q-input>

                        <q-select
                            v-model="tmpProvider.selectedModel"
                            :options="modelOptions"
                            options-dense
                            use-chips
                            :use-input="!isOllamaProvider({value: tmpProvider.name})"
                            input-debounce="0"
                            :new-value-mode="isOllamaProvider({value: tmpProvider.name}) ? undefined : 'add'"
                            @new-value="handleNewValue"
                        >
                            <template v-slot:prepend>
                                <q-icon size="xs" :name="mdiCreation" />
                            </template>

                            <!-- Update option template for all providers -->
                            <template v-slot:option="scope">
                                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents || {}">
                                    <q-item-section>
                                        <q-item-label>{{ formatModelName(scope.opt.value) }}</q-item-label>
                                    </q-item-section>
                                    <q-item-section v-if="!isOllamaProvider({value: tmpProvider.name})" side>
                                        <q-btn
                                            flat
                                            round
                                            dense
                                            size="xs"
                                            :icon="mdiDeleteOutline"
                                            @click.stop="handleDeleteModel(scope.opt.value)"
                                        >
                                        </q-btn>
                                    </q-item-section>
                                    </q-item>
                                </template>

                        </q-select>

                    </q-item-section>
                </q-item>
            </div>

            <!-- Replace the entire Model Manager Section with: -->
            <template v-if="showModelManager && isOllamaConfigured">
                <OllamaModelManager />
            </template>

        </q-list>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from "pinia";
import { mdiApi, mdiDownload, mdiRestart, mdiCircle, mdiPencil, mdiPlus, mdiDeleteOutline,
    mdiChevronUp, mdiChevronDown, mdiContentSave, mdiCloseBoxOutline,
    mdiCreation, mdiTag, mdiWeb, mdiKey, mdiEyeOff, mdiEye, mdiPencilCircle, mdiPlusCircle 
} from '@quasar/extras/mdi-v7';
import { useSettingsStore } from '@/stores/settings-store.js';
import defaultProviders from '@/services/providers.config.json';
import ollamaLogo from '@/assets/ollama-logo.png';
import openaiLogo from '@/assets/openai-logo.png';
import { useOllama } from '@/composables/useOllama';
import OllamaModelManager from '@/components/Settings/OllamaModelManager.vue';
import { useHelpers } from '@/composables/useHelpers';

const $q = useQuasar();
const { t } = useI18n();
const settingsStore = useSettingsStore();
const { defaultProvider, apiProviders } = storeToRefs(settingsStore);
const isPwd = ref(true);

// Check if apiProviders is empty and populate from defaultProviders
if (apiProviders.value.length === 0) {
    apiProviders.value = defaultProviders;
}

// Array of api providers to be used in select options
const apiProviderOptions = computed(() => 
    apiProviders.value.map(provider => ({
        label: provider.name,
        value: provider.name,
        logo: provider.name.toLowerCase().includes('ollama') ? ollamaLogo : openaiLogo
    }))
);

// Computed property to get the logo of the selected provider
const selectedProviderLogo = computed(() => {
    const selected = apiProviderOptions.value.find(option => option.value === defaultProvider.value.value);
    return selected ? selected.logo : null;
});

// Temporary provider object to store changes temporarilly and avoid changing the original values
const tmpProvider = ref({});

// Which action is being performed
const editProvider = ref(false);
const addProvider = ref(false);

const {
    availableModels,
    formatModelName,
    isOllamaRunning,
    isOllamaConfigured,
    restartingOllama,
    configureAndRestartOllama,
    checkOllamaStatus,
    downloadOllama,
    updateHost,
} = useOllama();

const isOllamaProvider = (providerObj) => {
    const provider = apiProviders.value.find(p => p.name === providerObj.value);
    return provider && (
        provider.name.toLowerCase().includes('ollama') || 
        provider.baseUrl.toLowerCase().includes('ollama')
    );
};

// Check if Ollama is running and configured correctly with interval
async function checkOllamaStatusWithInterval() {
    if (!isOllamaProvider(defaultProvider.value)) {
        return;
    }

    const provider = apiProviders.value.find(p => p.name === defaultProvider.value.value);
    if (!provider) return;

    await checkOllamaStatus(provider);

    if (isOllamaProvider(defaultProvider.value)) {
        setTimeout(checkOllamaStatusWithInterval, 300000);
    }
}

// Computed array of { providers, models } to use in select options
const modelOptions = computed(() => {
    const provider = tmpProvider.value;
    if (!provider) return [];

    // For Ollama provider, return available models
    if (isOllamaProvider({ value: provider.name })) {
        if (!isOllamaRunning.value || availableModels.value.length === 0) {
            return [];
        }
        return availableModels.value.map(model => ({
            label: formatModelName(model),
            value: model
        }));
    }
    
    // For other providers, ensure models array exists
    if (!provider.models) {
        provider.models = [];
    }
    
    // Return all models as options
    return provider.models.map(model => ({
        label: formatModelName(model),
        value: model
    }));
});

const isDownloadingOllama = ref(false);

async function handleDownloadOllama() {
    try {
        isDownloadingOllama.value = true;
        await downloadOllama();  // Use the composable function instead
        await checkOllamaStatus();
        // Show success notification
        $q.notify({
            type: 'positive',
            message: 'Ollama installed successfully'
        });
    } catch (error) {
        logger.error('[ProviderSettings] - Failed to download Ollama:', error);
        $q.notify({
            type: 'negative',
            message: 'Failed to install Ollama: ' + error.message
        });
    } finally {
        isDownloadingOllama.value = false;
    }
}

// Modify handleEditProvider to ensure model is properly set
function handleEditProvider() {
    const foundProvider = apiProviders.value.find(provider => provider.name === defaultProvider.value.value);
    if (!foundProvider) {
        logger.error('[ProviderSettings] - Provider not found');
        return;
    }
    // Deep-copy the found provider
    tmpProvider.value = JSON.parse(JSON.stringify(foundProvider));
    // Ensure models array exists
    if (!tmpProvider.value.models) {
        tmpProvider.value.models = [];
    }
    // Ensure selectedModel is set using the current provider's selection
    if (foundProvider.selectedModel) {
        tmpProvider.value.selectedModel = foundProvider.selectedModel;
    } else if (foundProvider.models && foundProvider.models.length > 0) {
        tmpProvider.value.selectedModel = foundProvider.models[0];
    } else {
        tmpProvider.value.selectedModel = null;
    }
    editProvider.value = true;
    showModelManager.value = false;
}

function handleAddNewProvider() {
    tmpProvider.value = { 
        name: '', 
        baseUrl: '', 
        apiKey: '',
        models: [],
        selectedModel: null
    };
    addProvider.value = true;
    showModelManager.value = false;
}

function handleDeleteProvider() {
    const index = apiProviders.value.findIndex(provider => provider.name === defaultProvider.value.value);
    if (index !== -1 && apiProviders.value[index].deletable !== false) {
        apiProviders.value.splice(index, 1);
        defaultProvider.value.value = apiProviders.value[0].name;
    }
}

function handleCancel() {
    addProvider.value = false;
    editProvider.value = false;
    tmpProvider.value = {};
}
function handleSaveProvider() {
    // Check for '' values
    if (tmpProvider.value.name === '' || tmpProvider.value.baseUrl === '' || tmpProvider.value.apiKey === '') {
        logger.error('[ProviderSettings] - Empty values');
        return;
    }

    if (editProvider.value == true) {
        const index = apiProviders.value.findIndex(provider => provider.name === defaultProvider.value.value);

        if (index !== -1) { // Provider found
            apiProviders.value[index] = { ...tmpProvider.value };
            // If the provider name is changed, re-select it
            defaultProvider.value.value = tmpProvider.value.name;
            editProvider.value = false;
        } else {
            logger.error('[ProviderSettings] - Provider not found');
        }
    } else if (addProvider.value == true) {
        const index = apiProviders.value.findIndex(provider => provider.name === tmpProvider.value.name);

        if (index === -1) { // Provider does not exist
            apiProviders.value.push({ ...tmpProvider.value });
            // We leave selecting the new provider to the user
            addProvider.value = false;
        } else { // Provider already exists
            // Notify the user
            logger.error('[ProviderSettings] - Provider already exists');
            return;
        }
    }

    tmpProvider.value = {};
}
const { iconColor } = useHelpers();
const showProviderForm = computed(() => editProvider.value || addProvider.value);

onMounted(() => {
    if (isOllamaProvider(defaultProvider.value)) {
        checkOllamaStatusWithInterval();
    }
});

// Add watcher for defaultProvider changes
watch(defaultProvider, async (newProvider) => {
    if (isOllamaProvider(newProvider)) {
        const provider = apiProviders.value.find(p => p.name === newProvider.value);
        if (provider) {
            updateHost(provider.baseUrl);
            await checkOllamaStatus(provider);
        }
    } else {
        isOllamaConfigured.value = false;
        isOllamaRunning.value = false;
    }
});

const showModelManager = ref(false);

function handleNewValue(val, done) {
    // Only allow adding models for non-Ollama providers
    if (isOllamaProvider({value: tmpProvider.value.name})) {
        done();
        return;
    }

    if (!tmpProvider.value.models) {
        tmpProvider.value.models = [];
    }
    if (!tmpProvider.value.models.includes(val)) {
        tmpProvider.value.models.push(val);
    }
    done(val); // This tells q-select to add the value
}

// Add the delete model handler
function handleDeleteModel(modelValue) {
    // Only allow deleting models for non-Ollama providers
    if (isOllamaProvider({value: tmpProvider.value.name})) return;
    
    if (!tmpProvider.value.models) return;
    
    const index = tmpProvider.value.models.indexOf(modelValue);
    if (index > -1) {
        tmpProvider.value.models.splice(index, 1);
        
        // Reset selected model if it was deleted
        if (tmpProvider.value.selectedModel === modelValue) {
            tmpProvider.value.selectedModel = tmpProvider.value.models[0] || null;
        }
    }
}

</script>

<style scoped>
/* Your component styles here */
.ollama-management {
  max-width: 600px;
}
</style>