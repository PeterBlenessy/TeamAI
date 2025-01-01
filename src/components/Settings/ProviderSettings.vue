<template>
    <div>
        <q-list>
            <q-item>
                <q-item-section avatar>
                    <q-icon name="mdi-api" :color="iconColor" />
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
                                    <q-btn v-if="!isOllamaConnected" 
                                        flat dense size="sm"
                                        icon="mdi-download" 
                                        color="warning"
                                        :loading="isDownloadingOllama"
                                        @click.stop.prevent="handleDownloadOllama"
                                    >
                                        <q-tooltip>Download and install Ollama</q-tooltip>
                                    </q-btn>
                                    
                                    <!-- Running but needs configuration -->
                                    <q-btn v-else-if="!isOllamaConfigured"
                                        flat dense size="sm" 
                                        icon="mdi-restart"
                                        color="warning"
                                        :loading="restartingOllama"
                                        @click.stop.prevent="configureAndRestartOllama"
                                    >
                                        <q-tooltip>Configuration needed</q-tooltip>
                                    </q-btn>
                                    
                                    <!-- Running correctly -->
                                    <q-icon v-else
                                        name="mdi-circle"
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
                        <q-btn v-if="isOllamaProvider(defaultProvider)"
                            size="sm" style="min-width: 90px" padding="xs" 
                            :icon="showModelManager ? 'mdi-cog-outline' : 'mdi-cog-outline'"
                            :icon-right="showModelManager ? 'mdi-chevron-up' : 'mdi-chevron-down'"
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

                        <q-select
                            v-model="tmpProvider.models"
                            :options="allModelOptions"
                            options-dense
                            new-value-mode="add-unique" use-chips use-input multiple
                            input-debounce="0"
                            emit-value
                            map-options
                        >
                            <template v-slot:prepend>
                                <q-icon size="xs" name="mdi-creation" />
                            </template>

                            <!-- Option display -->
                            <template v-if="isOllamaProvider(defaultProvider)" 
                                v-slot:option="scope"
                            >
                                <q-item v-bind="scope.itemProps" v-on="scope.itemEvents || {}">
                                    <q-item-section>
                                        <q-item-label>{{ formatModelName(scope.opt.value) }}</q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <template v-if="getModelStatus(scope.opt.value).downloaded">
                                            <q-btn flat round dense size="sm" icon="mdi-delete" 
                                                @click.stop="deleteModel(scope.opt.value)">
                                                <q-tooltip>Delete model</q-tooltip>
                                            </q-btn>
                                        </template>
                                        <template v-else>
                                            <q-btn flat round dense size="sm" icon="mdi-download"
                                                :loading="modelDownloading[scope.opt.value]"
                                                @click.stop="pullSpecificModel(scope.opt.value)">
                                                <q-tooltip>Download model</q-tooltip>
                                            </q-btn>
                                        </template>
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

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../../stores/settings-store.js';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import defaultProviders from '../../services/providers.config.json';
import { ollamaService } from '../../services/ollama.service';
import ollamaLogo from '../../assets/ollama-logo.png';
import openaiLogo from '../../assets/openai-logo.png';
import { useOllama } from '../../composables/useOllama';
import OllamaModelManager from './OllamaModelManager.vue';

export default {
    components: {
        OllamaModelManager
    },
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const settingsStore = useSettingsStore();
        const { defaultProvider, apiProviders } = storeToRefs(settingsStore);

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
            const selected = apiProviderOptions.value.find(option => option.value === defaultProvider.value);
            return selected ? selected.logo : null;
        });

        // Temporary provider object to store changes temporarilly and avoid changing the original values
        const tmpProvider = ref({});

        // Which action is being performed
        const editProvider = ref(false);
        const addProvider = ref(false);

        const {
            availableModels,
            modelDownloading,
            pullProgress,
            formatModelName,
            getModelStatus,
            pullSpecificModel,
            deleteModel,
            getAllModelOptions,
            isOllamaConnected,
            isOllamaConfigured,
            restartingOllama,
            configureAndRestartOllama,
            checkOllamaStatus
        } = useOllama();

        const isOllamaProvider = (providerName) => {
            const provider = apiProviders.value.find(p => p.name === providerName);
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

            const provider = apiProviders.value.find(p => p.name === defaultProvider.value);
            if (!provider) return;

            await checkOllamaStatus(provider);

            if (isOllamaProvider(defaultProvider.value)) {
                setTimeout(checkOllamaStatusWithInterval, 300000);
            }
        }

        // Replace allModelOptions computed with getAllModelOptions from composable
        const allModelOptions = computed(() => 
            getAllModelOptions(tmpProvider.value, availableModels.value)
        );

        const isDownloadingOllama = ref(false);

        async function handleDownloadOllama() {
            try {
                isDownloadingOllama.value = true;
                await ollamaService.downloadOllama();
                // Check status after installation
                await checkOllamaStatus();
                // Show success notification
                $q.notify({
                    type: 'positive',
                    message: 'Ollama installed successfully'
                });
            } catch (error) {
                console.error('Failed to download Ollama:', error);
                $q.notify({
                    type: 'negative',
                    message: 'Failed to install Ollama: ' + error.message
                });
            } finally {
                isDownloadingOllama.value = false;
            }
        }

        // Modify handleEditProvider to ensure model is properly set
        const handleEditProvider = () => {
            const foundProvider = apiProviders.value.find(provider => provider.name === defaultProvider.value);
            // Deep-copy the found provider
            tmpProvider.value = JSON.parse(JSON.stringify(foundProvider));
            // Ensure selectedModel is set using the current provider's selection
            if (foundProvider && foundProvider.selectedModel) {
                tmpProvider.value.selectedModel = foundProvider.selectedModel;
            } else if (foundProvider && foundProvider.models && foundProvider.models.length > 0) {
                // Fallback to first model in the list if no selected model
                tmpProvider.value.selectedModel = foundProvider.models[0];
            } else {
                tmpProvider.value.selectedModel = null;
            }
            editProvider.value = true;
            showModelManager.value = false;
        };

        // Add new function to handle model selection
        function handleModelSelection(value) {
            console.log('Selected model:', value);
            if (value) {
                tmpProvider.value.selectedModel = value;
            }
        }

        function handleAddNewProvider() {
            tmpProvider.value = { name: '', baseUrl: '', apiKey: '' };
            addProvider.value = true;
            showModelManager.value = false;
        }

        function handleDeleteProvider() {
            const index = apiProviders.value.findIndex(provider => provider.name === defaultProvider.value);
            if (index !== -1 && apiProviders.value[index].deletable !== false) {
                apiProviders.value.splice(index, 1);
                defaultProvider.value = apiProviders.value[0].name;
            }
        }

        function handleCancel() {
            addProvider.value = false;
            editProvider.value = false;
            tmpProvider.value = {};
        }

        const iconColor = computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8');
        const showProviderForm = computed(() => editProvider.value || addProvider.value);

        onMounted(() => {
            if (isOllamaProvider(defaultProvider.value)) {
                checkOllamaStatusWithInterval();
            }
        });

        // Add watcher for defaultProvider changes
        watch(defaultProvider, async (newProvider) => {
            if (isOllamaProvider(newProvider)) {
                const provider = apiProviders.value.find(p => p.name === newProvider);
                await checkOllamaStatus(provider);
            } else {
                isOllamaConfigured.value = false;
                isOllamaConnected.value = false;
            }
        });

        const showModelManager = ref(false);

        return {
            t,
            defaultProvider,
            apiProviderOptions,
            tmpProvider,
            addProvider,
            editProvider,
            showProviderForm,
            isPwd: ref(true),
            handleEditProvider,
            handleAddNewProvider,
            handleDeleteProvider,
            handleCancel,
            iconColor,
            restartingOllama,
            isOllamaProvider,
            configureAndRestartOllama,
            isOllamaConfigured,
            isOllamaConnected,
            isDownloadingOllama,
            handleDownloadOllama,
            availableModels,
            allModelOptions,
            getModelStatus,
            formatModelName,
            pullSpecificModel,
            modelDownloading,
            pullProgress,
            deleteModel,
            handleModelSelection,
            showModelManager,
            selectedProviderLogo,
        };
    }
}
</script>

<style scoped>
/* Your component styles here */
.ollama-management {
  max-width: 600px;
}
</style>