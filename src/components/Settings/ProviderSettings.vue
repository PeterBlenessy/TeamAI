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

            <!-- Model Manager Section -->
            <template v-if="showModelManager && isOllamaConfigured">

                <q-card flat bordered class="q-mt-md">
                    <q-card-section>
                        <div class="text-h6">Ollama Model Manager</div>
                                        <!-- Move the input here -->
                        <div class="row q-col-gutter-md items-center q-mt-md">
                            <q-input
                                dense filled
                                class="col"
                                v-model="newModelName"
                                label="Download new model"
                                placeholder="Enter the name of the model to download"
                                @keyup.enter="handleAddCustomModel"
                            >
                            <template v-slot:append v-if="newModelName">
                                <q-circular-progress v-if="newModelLoading"
                                    show-value
                                    :value="pullProgress"
                                    color="primary"
                                    size="md"
                                    :thickness="0.4"
                                />
                                <q-btn v-else
                                    flat round size="sm" icon="mdi-download"
                                    @click="handleAddCustomModel"
                                />
                            </template>
                            </q-input>
                        </div>

                    </q-card-section>
                    <q-card-section>
                        <q-table
                            :rows="availableModels"
                            :columns="modelColumns"
                            row-key="name"
                            dense
                            flat
                            :loading="tableLoading"
                            :rows-per-page-options="[0]"
                        >
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td key="name">
                                        {{ formatModelName(props.row) }}
                                    </q-td>
                                    <q-td key="architecture">
                                        {{ modelDetails[props.row]?.model_info["general.architecture"] || '-' }}
                                    </q-td>
                                    <q-td key="size">
                                        {{ modelDetails[props.row]?.details?.parameter_size || '-' }}
                                    </q-td>
                                    <q-td key="quantization">
                                        {{ modelDetails[props.row]?.details?.quantization_level || '-' }}
                                    </q-td>
                                    <q-td key="modified">
                                        {{ modelDetails[props.row]?.modified_at ? 
                                            new Date(modelDetails[props.row].modified_at).toLocaleString() : '-' }}
                                    </q-td>
                                    <q-td key="actions">
                                        <q-btn v-if="modelDetails[props.row]"
                                            flat dense size="sm"
                                            icon="mdi-file-document-outline"
                                            @click="showLicenseInfo(props.row)"
                                        >
                                            <q-tooltip>Show license info</q-tooltip>
                                        </q-btn>
                                        <q-btn
                                            flat dense size="sm"
                                            icon="mdi-delete"
                                            @click="deleteModel(props.row)"
                                        >
                                            <q-tooltip>Delete model</q-tooltip>
                                        </q-btn>
                                        <q-btn
                                            flat dense size="sm"
                                            icon="mdi-reload"
                                            :color="runningModels[props.row] ? 'positive' : ''"
                                            @click="loadModel(props.row)"
                                        >
                                            <q-tooltip>
                                                {{ runningModels[props.row] ? 'Model is running' : 'Model is stopped' }}
                                            </q-tooltip>
                                        </q-btn>
                                    </q-td>
                                </q-tr>
                            </template>
                        </q-table>
                    </q-card-section>
                </q-card>

                <!-- Model Details Dialog -->
                <q-dialog v-model="showLicenseDialog">
                    <q-card style="min-width: 600px; max-width: 90%;" class="q-pa-md">
                        <q-card-section>
                            <div class="text-h6">{{ formatModelName(selectedLicenseModelName) }}</div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section v-if="selectedLicenseData">
                            <div class="text-subtitle2">License</div>
                            <q-list dense>
                                <q-item>
                                    <q-item-section>
                                        <pre class="text-caption">{{ selectedLicenseData.license }}</pre>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card-section>

                        <q-card-actions align="right">
                            <q-btn flat label="Close" color="primary" v-close-popup />
                        </q-card-actions>
                    </q-card>
                </q-dialog>
            </template>

        </q-list>
    </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { Command } from '@tauri-apps/plugin-shell';
import { platform } from '@tauri-apps/plugin-os';
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../../stores/settings-store.js';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import defaultProviders from '../../services/providers.config.json';
import { ollamaService } from '../../services/ollama.service';
import ollamaLogo from '../../assets/ollama-logo.png';
import openaiLogo from '../../assets/openai-logo.png';

export default {
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

        const restartingOllama = ref(false);

        const isOllamaProvider = (providerName) => {
            const provider = apiProviders.value.find(p => p.name === providerName);
            return provider && (
                provider.name.toLowerCase().includes('ollama') || 
                provider.baseUrl.toLowerCase().includes('ollama')
            );
        };

        async function configureAndRestartOllama() {
            restartingOllama.value = true;
            try {
                const os = platform();
                
                // Set environment variable
                switch (os) {
                    case 'macos':
                        await new Command('launchctl')
                            .execute(['setenv', 'OLLAMA_ORIGINS', '*']);
                        break;
                    case 'windows':
                        await new Command('setx')
                            .execute(['OLLAMA_ORIGINS', '*']);
                        break;
                    case 'linux':
                        await new Command('export')
                            .execute(['OLLAMA_ORIGINS=*']);
                        break;
                }

                // Kill Ollama
                switch (os) {
                    case 'macos':
                        await new Command('killall')
                            .execute(['Ollama']);
                        break;
                    case 'windows':
                        await new Command('taskkill')
                            .execute(['/IM', 'ollama.exe', '/F']);
                        break;
                    case 'linux':
                        await new Command('pkill')
                            .execute(['ollama']);
                        break;
                }

                // Wait for process to terminate
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Start Ollama
                switch (os) {
                    case 'macos':
                        await new Command('open')
                            .execute(['-a', 'Ollama']);
                        break;
                    case 'windows':
                        await new Command('cmd')
                            .execute(['/C', 'start', '', 'ollama']);
                        break;
                    case 'linux':
                        await new Command('ollama')
                            .execute(['serve']);
                        break;
                }

                console.log('Successfully configured and restarted Ollama');
            } catch (error) {
                console.error('Failed to configure and restart Ollama:', error);
            } finally {
                restartingOllama.value = false;
            }
        }

        const isOllamaConnected = ref(false);
        const isOllamaConfigured = ref(false);

        // Check if Ollama is running and configured correctly
        async function checkOllamaStatus() {
            if (!isOllamaProvider(defaultProvider.value)) {
                return;
            }

            const provider = apiProviders.value.find(p => p.name === defaultProvider.value);
            if (!provider) return;

            ollamaService.setHost(provider.baseUrl);

            isOllamaConnected.value = await ollamaService.checkConnection();
            console.log('Ollama connected:', isOllamaConnected.value);
            if (isOllamaConnected.value) {
                isOllamaConfigured.value = await ollamaService.isConfiguredCorrectly();
                if (isOllamaConfigured.value) {
                    loadAvailableModels();
                }
            }

            if (isOllamaProvider(defaultProvider.value)) {
                setTimeout(checkOllamaStatus, 300000);
            }
        }

        const availableModels = ref([]);

        async function loadAvailableModels() {
            try {
                availableModels.value = await ollamaService.listModels();
            } catch (error) {
                console.error('Failed to load models:', error);
            }
        }

        // Helper to get base name and version
        function getBaseName(name) {
            if (!name || typeof name !== 'string') return { base: '', version: '' };
            const [base, version] = name.split(':');
            return {
                base: base.trim().toLowerCase(),
                version: version ? version.trim().toLowerCase() : ''
            };
        }

        // Helper function to format model name
        function formatModelName(name) {
            if (!name || typeof name !== 'string') return '';
            const { base, version } = getBaseName(name);
            return version ? `${base}:${version}` : base;
        }

        const modelDownloading = ref({});
        const pullProgress = ref(0);

        // Modified pull specific model function
        async function pullSpecificModel(modelName) {
            if (!modelName) return;
            
            const baseName = getBaseName(modelName);
            if (!baseName) {
                $q.notify({
                    type: 'negative',
                    message: 'Invalid model name'
                });
                return;
            }
            
            modelDownloading.value[modelName] = true;
            pullProgress.value = 0;
            
            try {
                await ollamaService.pullModel(modelName, (progress) => {
                    if (progress > pullProgress.value) {  // Only update if progress increases
                        pullProgress.value = progress;
                    }
                });
                await loadAvailableModels();
                
                // Ensure the model is in the provider's model list
                if (!tmpProvider.value.models) {
                    tmpProvider.value.models = [];
                }
                if (!tmpProvider.value.models.includes(modelName)) {
                    tmpProvider.value.models.push(modelName);
                }

                // Add new model to Ollama provider in apiProviders
                const ollamaProvider = apiProviders.value.find(
                    p => p.name.toLowerCase() === 'ollama'
                );
                if (ollamaProvider) {
                    if (!ollamaProvider.models) {
                        ollamaProvider.models = [];
                    }
                    if (!ollamaProvider.models.includes(modelName)) {
                        ollamaProvider.models.push(modelName);
                    }
                }

                $q.notify({
                    type: 'positive',
                    message: `Model ${modelName} downloaded successfully`
                });
            } catch (error) {
                console.error(`Failed to pull model ${modelName}:`, error);
                $q.notify({
                    type: 'negative',
                    message: `Failed to pull model ${modelName}: ${error.message}`
                });
            } finally {
                modelDownloading.value[modelName] = false;
                pullProgress.value = 0;
            }
        }

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

        // Modified computed property for all models
        const allModelOptions = computed(() => {
            if (!isOllamaProvider(tmpProvider.value?.name)) {
                return tmpProvider.value?.models || [];
            }

            // Get built-in models from the provider config
            const preConfiguredModels = tmpProvider.value?.models || [];
            
            // Get all available models
            const downloadedModels = availableModels.value || [];
            
            // Create a map to store the best version for each base model
            const modelMap = new Map();

            // Process downloaded models first (they take precedence)
            downloadedModels.forEach(model => {
                const { base } = getBaseName(model);
                modelMap.set(base, model);
            });

            // Process preconfigured models
            preConfiguredModels.forEach(model => {
                const { base } = getBaseName(model);
                // Only add if there isn't already a downloaded version
                if (!modelMap.has(base)) {
                    modelMap.set(base, model);
                }
            });

            // Convert map to array and create option objects
            return Array.from(modelMap.values())
                .filter(model => model) // Filter out empty/invalid models
                .map(model => ({
                    label: formatModelName(model),
                    value: model,
                    downloaded: getModelStatus(model).downloaded
                }));
        });

        // Helper function to get model status
        function getModelStatus(modelName) {
            if (!modelName) return { downloaded: false, downloading: false };
            const { base } = getBaseName(modelName);
            return {
                downloaded: availableModels.value.some(m => getBaseName(m).base === base),
                downloading: !!modelDownloading.value[modelName]
            };
        }

        // Function to delete a model
        async function deleteModel(modelName) {
            console.log('Attempting to delete model:', modelName);
            if (!modelName) {
                console.error('No model name provided for deletion');
                return;
            }
            
            try {
                // Get the base name of the model we want to delete
                const { base } = getBaseName(modelName);
                console.log('Looking for model with base:', base);
                
                // Find all instances of this model in availableModels
                const modelInstances = availableModels.value.filter(m => {
                    const { base: downloadedBase } = getBaseName(m);
                    return downloadedBase === base;
                });

                console.log('Found model instances:', modelInstances);

                if (modelInstances.length === 0) {
                    throw new Error('Model not found in downloaded models');
                }

                // Delete all versions of the model
                for (const modelInstance of modelInstances) {
                    await ollamaService.deleteModel(modelInstance);
                }

                await loadAvailableModels();
                
                // Remove from provider's models list if it exists
                if (tmpProvider.value.models) {
                    tmpProvider.value.models = tmpProvider.value.models.filter(m => {
                        const { base: modelBase } = getBaseName(m);
                        return modelBase !== base;
                    });
                }
                
                // If this was the selected model, clear it
                if (tmpProvider.value.selectedModel && getBaseName(tmpProvider.value.selectedModel).base === base) {
                    tmpProvider.value.selectedModel = null;
                }

                $q.notify({
                    type: 'positive',
                    message: `Model ${base} and all its versions deleted successfully`
                });
            } catch (error) {
                console.error(`Failed to delete model ${modelName}:`, error);
                $q.notify({
                    type: 'negative',
                    message: `Failed to delete model ${modelName}: ${error.message}`
                });
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

        onMounted(() => {
            if (isOllamaProvider(defaultProvider.value)) {
                checkOllamaStatus();
            }
        });

        // Add watcher for defaultProvider changes
        watch(defaultProvider, async (newProvider) => {
            if (isOllamaProvider(newProvider)) {
                await checkOllamaStatus();
            } else {
                isOllamaConfigured.value = false;
                isOllamaConnected.value = false;
            }
        });

        // Add new refs for model details
        const modelDetails = ref({});
        const loadingDetails = ref({});

        // Function to load model details
        async function loadModelDetails(modelName) {
            if (loadingDetails.value[modelName]) return;
            
            loadingDetails.value[modelName] = true;
            try {
                const details = await ollamaService.showModel(modelName);
                modelDetails.value[modelName] = details;
            } catch (error) {
                console.error(`Failed to load details for model ${modelName}:`, error);
                $q.notify({
                    type: 'negative',
                    message: `Failed to load model details: ${error.message}`
                });
            } finally {
                loadingDetails.value[modelName] = false;
            }
        }

        // Clean up model details when changing providers
        watch(defaultProvider, () => {
            modelDetails.value = {};
            loadingDetails.value = {};
        });

        const showLicenseDialog = ref(false);
        const selectedLicenseModelName = ref('');
        const selectedLicenseData = computed(() => 
            selectedLicenseModelName.value ? modelDetails.value[selectedLicenseModelName.value] : null
        );

        function showLicenseInfo(modelName) {
            selectedLicenseModelName.value = modelName;
            showLicenseDialog.value = true;
        }

        // Add new refs and computed properties for the table
        const showModelManager = ref(false);
        const tableLoading = ref(false);
        
        const modelColumns = [
            { name: 'name', label: 'Model', field: row => formatModelName(row), align: 'left' },
            { name: 'architecture', label: 'Architecture', field: row => modelDetails.value[row]?.model_info["general.architecture"] || '-', align: 'left' },
            { name: 'size', label: 'Size', field: row => modelDetails.value[row]?.details?.parameter_size || '-', align: 'left' },
            { name: 'quantization', label: 'Quantization', field: row => modelDetails.value[row]?.details?.quantization_level || '-', align: 'left' },
            { name: 'modified', label: 'Modified', field: row => modelDetails.value[row]?.modified_at || '-', align: 'left' },
            { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
        ];

        // Modify loadAvailableModels to load details automatically
        async function loadAvailableModels() {
            tableLoading.value = true;
            try {
                const models = await ollamaService.listModels();
                availableModels.value = models;
                // Load details for all models
                for (const model of models) {
                    await loadModelDetails(model);
                }
            } catch (error) {
                console.error('Failed to load models:', error);
            } finally {
                tableLoading.value = false;
            }
        }

        const runningModels = ref({});

        async function loadModel(modelName) {
            if (await ollamaService.loadModel(modelName)) {
                runningModels.value[modelName] = true;
            }
        }

        function displayModelStatus(modelName) {
            return runningModels.value[modelName] ? 'Model is loaded' : 'Model is not loaded';
        }

        const newModelName = ref('');
        const newModelLoading = ref(false);
        function handleAddCustomModel() {
            if (!newModelName.value) return;
            newModelLoading.value = true;
            pullSpecificModel(newModelName.value)
                .finally(() => {
                    newModelLoading.value = false;
                    newModelName.value = '';
                });
        }

        return {
            t,

            defaultProvider,
            apiProviderOptions,
            tmpProvider,

            addProvider,
            editProvider,
            showProviderForm: computed(() => editProvider.value || addProvider.value),

            // Show/hide password
            isPwd: ref(true),

            handleEditProvider,

            handleAddNewProvider: () => {
                tmpProvider.value = { name: '', baseUrl: '', apiKey: '' };
                addProvider.value = true;
                showModelManager.value = false;
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
                        return;                    }
                }

                tmpProvider.value = {};
            },

            handleCancel: () => {
                addProvider.value = false;
                editProvider.value = false;
                tmpProvider.value = {};
            },

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8'),

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
            getBaseName,

            pullSpecificModel,
            modelDownloading,
            pullProgress,
            deleteModel,
            handleModelSelection,

            modelDetails,
            loadingDetails,
            loadModelDetails,

            showLicenseDialog,
            selectedLicenseModelName,
            selectedLicenseData,
            showLicenseInfo,

            showModelManager,
            tableLoading,
            modelColumns,

            runningModels,
            loadModel,
            displayModelStatus,

            newModelName,
            handleAddCustomModel,
            newModelLoading,
            selectedProviderLogo,
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