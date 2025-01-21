import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import createOllamaService from '@/services/ollama.service';
import { useSettingsStore } from '@/stores/settings-store';
import logger from '@/services/logger';
import { storeToRefs } from "pinia";

export function useOllama(provider = null) {
    const $q = useQuasar();
    const settingsStore = useSettingsStore();
    const { apiProviders } = storeToRefs(settingsStore);
    
    // Get Ollama provider configuration from store
    const getOllamaConfig = () => {
        // Use storeToRefs for reactive state access
        const { apiProviders } = storeToRefs(settingsStore);
        
        logger.info('[useOllama] - Getting Ollama config from store');
        
        if (!apiProviders.value || apiProviders.value.length === 0) {
            logger.warn('[useOllama] - No providers found in store');
            return null;
        }

        const ollamaProvider = apiProviders.value.find(p => 
            p.name?.toLowerCase().includes('ollama') || 
            p.baseUrl?.toLowerCase().includes('ollama')
        );
        
        logger.info(`[useOllama] - Found Ollama provider: ${ollamaProvider.name}, ${ollamaProvider.baseUrl}`);
        return ollamaProvider?.baseUrl;
    };

    // Watch for changes in apiProviders
    // to update the Ollama service instance with the new provider configuration
    watch(apiProviders, async (newProviders) => {
        const ollamaProvider = newProviders.find(p => 
            p.name?.toLowerCase().includes('ollama') || 
            p.baseUrl?.toLowerCase().includes('ollama')
        );
        
        if (ollamaProvider?.baseUrl) {
            logger.info(`[useOllama] - Updating host from provider change: ${ollamaProvider.baseUrl}`);
            updateHost(ollamaProvider.baseUrl);
            await checkOllamaStatus(ollamaProvider);
        }
    });

    // Create service instance with baseUrl, with fallback
    const baseUrl = provider?.baseUrl || getOllamaConfig() || 'http://localhost:11434';
    logger.info(`[useOllama] - Initializing with baseUrl: ${baseUrl}`);
    
    let ollamaService = createOllamaService(baseUrl);

    // Initialize refs
    const availableModels = ref([]);
    const modelDownloading = ref({});
    const pullProgress = ref(0);
    const modelDetails = ref({});
    const modelInformation = ref({});
    const runningModels = ref({});
    const isOllamaRunning = ref(false);
    const isOllamaConfigured = ref(false);
    const restartingOllama = ref(false);

    //--------------------------------------------------------------------------------
    // GENERAL HALPER FUNCTIONS
    //--------------------------------------------------------------------------------

    // Get base name and version, if available
    function getBaseName(name) {
        if (!name || typeof name !== 'string') return { base: '', version: '' };
        const [base, version] = name.split(':');
        return {
            base: base.trim().toLowerCase(),
            version: version ? version.trim().toLowerCase() : ''
        };
    }

    // Format model name to `name:version`
    function formatModelName(name) {
        if (!name || typeof name !== 'string') return '';
        const { base, version } = getBaseName(name);
        return version ? `${base}:${version}` : base;
    }

    // Add this helper function after the other helper functions
    function syncModelsWithProvider(models) {
        const ollamaProvider = apiProviders.value.find(p => 
            p.name?.toLowerCase().includes('ollama') || 
            p.baseUrl?.toLowerCase().includes('ollama')
        );

        if (!ollamaProvider) {
            logger.warn('[useOllama] - No Ollama provider found for model sync');
            return;
        }

        // Update provider's models array directly with model names
        ollamaProvider.models = models;

        // Update the store
        settingsStore.updateApiProvider(ollamaProvider);
        logger.info(`[useOllama] - Synced models with provider: ${JSON.stringify(models)}`);
    }

    //--------------------------------------------------------------------------------
    // FUNCTIONS TO HANDLE MODEL DOWNLOADS
    //--------------------------------------------------------------------------------

    // Holds models being downloaded to expose to the UI, so the UI does not have to look in the store.
    // We want to keep it in the store, so downloads can be restored on app restart.
    const downloadingModels = computed(() => settingsStore.downloadingModels);

    // Update the store with a new model being downloaded
    const addDownloadingModel = (modelName) => {
        settingsStore.downloadingModels.push({
            name: modelName,
            progress: 0
        });
    };

    // Update download progress for a model in the store, so it can be restored on app restart.
    const updateDownloadProgress = (modelName, progress) => {
        const model = settingsStore.downloadingModels.find(m => m.name === modelName);
        if (model) {
            model.progress = progress;
        }
    };

    const removeDownloadingModel = (modelName) => {
        settingsStore.downloadingModels = settingsStore.downloadingModels.filter(
            m => m.name !== modelName
        );
        modelDownloading.value[modelName] = false;
    };

    // Get the downloading status of a model, i.e., downloading or downloaded
    function getModelDownloadStatus(modelName) {
        if (!modelName) return { downloaded: false, downloading: false };
        const { base } = getBaseName(modelName);
        return {
            downloaded: availableModels.value.some(m => getBaseName(m).base === base),
            downloading: !!modelDownloading.value[modelName]
        };
    }

    // Resume previously started model downloads
    async function resumeDownloads() {
        logger.info(`[useOllama] - Resuming downloads: ${JSON.stringify(settingsStore.downloadingModels)}`);
        for (const model of settingsStore.downloadingModels) {
            // Re-trigger pull for each downloading model
            downloadModel(model.name, true);
        }
    }

    // Download a model from Ollama repository
    async function downloadModel(modelName, isResume = false) {
        if (!modelName) return;

        const baseName = getBaseName(modelName);
        if (!baseName) {
            logger.error(`[useOllama] - Invalid model name: ${modelName}`);
            $q.notify({
                type: 'negative',
                message: 'Invalid model name'
            });
            return;
        }

        try {
            if (!isResume) {
                modelDownloading.value[modelName] = true;
                pullProgress.value = 0;
                addDownloadingModel(modelName);
            }

            await ollamaService.pullModel(modelName, (progress) => {
                if (progress > pullProgress.value) {
                    pullProgress.value = progress;
                    updateDownloadProgress(modelName, progress);
                }
            });

            // After successful download, update available models and sync
            await getAvailableModels();
            return true;
        } catch (error) {
            logger.error(`[useOllama] - Failed to pull model ${modelName}: ${error}`);
            throw error;
        } finally {
            removeDownloadingModel(modelName);
            pullProgress.value = 0;
        }
    }

    async function cancelModelDownload(modelName) {
        try {
            if (ollamaService.cancelModelDownload(modelName)) {
                removeDownloadingModel(modelName);
                modelDownloading.value[modelName] = false;
                pullProgress.value = 0;
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`[useOllama] - Failed to cancel download: ${error}`);
            throw error;
        }
    }

    //--------------------------------------------------------------------------------
    // FUNCTIONS TO HANDLE MODEL OPERATIONS
    //--------------------------------------------------------------------------------

    // Delete model
    async function deleteModel(modelName) {
        if (!modelName) {
            logger.error('[useOllama] - No model name provided for deletion');
            return false;
        }

        try {
            const { base } = getBaseName(modelName);

            const modelInstances = availableModels.value.filter(m => {
                const { base: downloadedBase } = getBaseName(m);
                return downloadedBase === base;
            });

            if (modelInstances.length === 0) {
                throw new Error('Model not found in downloaded models');
            }

            for (const modelInstance of modelInstances) {
                await ollamaService.deleteModel(modelInstance);
            }

            // After successful deletion, update available models and sync
            await getAvailableModels();

            return true;
        } catch (error) {
            logger.error(`[useOllama] - Failed to delete model ${modelName}: ${error}`);
            throw new Error(`Failed to delete model ${modelName}: ${error.message}`);
        }
    }

    // Get information for a model
    async function getModelInformation(modelName) {
        if (modelInformation.value[modelName]) return;

        modelInformation.value[modelName] = true;
        try {
            const details = await ollamaService.showModel(modelName);
            modelDetails.value[modelName] = details;
        } catch (error) {
            logger.error(`[useOllama] - Failed to load details for model ${modelName}: ${error}`);
            throw new Error(`Failed to load details for model ${modelName}: ${error.message}`);
        } finally {
            modelInformation.value[modelName] = false;
        }
    }

    // Get available (downloaded) models and their information
    async function getAvailableModels() {
        try {
            const models = await ollamaService.listModels();
            availableModels.value = models;

            // Sync with provider store
            syncModelsWithProvider(models);

            // Get information for all models
            for (const model of models) {
                await getModelInformation(model);
            }
        } catch (error) {
            logger.error('[useOllama] - Failed to load models:', error);
        }
    }

    // Load model in Ollama server
    async function loadModel(modelName) {
        if (await ollamaService.loadModel(modelName)) {
            runningModels.value[modelName] = true;
            return true;
        }
        return false;
    }

    // Check if model is loaded in Ollama server
    async function isModelLoaded(modelName) {
        try {
            const runningModels = await ollamaService.ps();
            return runningModels.includes(modelName);
        } catch (error) {
            logger.error('[useOllama] - Failed to check model status:', error);
            return false;
        }
    }

    //--------------------------------------------------------------------------------
    // FUNCTIONS TO HANDLE OLLAMA SERVER
    //--------------------------------------------------------------------------------

    // Restart Ollama server with updated environment variables on the supported platforms
    async function configureAndRestartOllama() {
        restartingOllama.value = true;
        try {
            const os = platform();

            // Set environment variable
            switch (os) {
                case 'macos':
                    await new Command('launchctl').execute(['setenv', 'OLLAMA_ORIGINS', '*']);
                    break;
                case 'windows':
                    await new Command('setx').execute(['OLLAMA_ORIGINS', '*']);
                    break;
                case 'linux':
                    await new Command('export').execute(['OLLAMA_ORIGINS=*']);
                    break;
            }

            // Kill Ollama
            switch (os) {
                case 'macos':
                    await new Command('killall').execute(['Ollama']);
                    break;
                case 'windows':
                    await new Command('taskkill').execute(['/IM', 'ollama.exe', '/F']);
                    break;
                case 'linux':
                    await new Command('pkill').execute(['ollama']);
                    break;
            }

            // Wait for process to terminate
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Start Ollama
            switch (os) {
                case 'macos':
                    await new Command('open').execute(['-a', 'Ollama']);
                    break;
                case 'windows':
                    await new Command('cmd').execute(['/C', 'start', '', 'ollama']);
                    break;
                case 'linux':
                    await new Command('ollama').execute(['serve']);
                    break;
            }

            logger.info('[useOllama] - Successfully configured and restarted Ollama');
        } catch (error) {
            logger.error(`[useOllama] - Failed to configure and restart Ollama: ${error}`);
        } finally {
            restartingOllama.value = false;
        }
    }

    // Checks if the Ollama server is running and configured to be reachable
    async function checkOllamaStatus(providerConfig) {
        if (!providerConfig?.baseUrl) {
            logger.warn('[useOllama] - No Ollama provider configuration provided');
            return;
        }

        const { isRunning, needsConfig } = await ollamaService.checkConnection();
        isOllamaRunning.value = isRunning;
        isOllamaConfigured.value = !needsConfig;

        if (isOllamaRunning.value && isOllamaConfigured.value) {
            logger.info('[useOllama] - Ollama server is running and configured');
            await getAvailableModels();
            await resumeDownloads();
        } else {
            logger.warn('[useOllama] - Ollama server is not running or configured');
        }

        return { isRunning, needsConfig };
    }

    // Get models running in Ollama server
    async function getRunningModels() {
        try {
            return await ollamaService.ps();
        } catch (error) {
            logger.error(`[useOllama] - Failed to get running models: ${error}`);
            return [];
        }
    }

    // Check if the provider is an Ollama provider
    function isOllamaProvider(providerName) {
        return ollamaService?.isOllamaProvider(providerName);
    }

    // Remove reinitialize and expose setHost instead
    const updateHost = (baseUrl) => {
        if (!baseUrl) {
            logger.warn('[useOllama] - No baseUrl provided for host update');
            return;
        }
        ollamaService.setHost(baseUrl);
    };

    return {
        // General helper functions
        getBaseName,
        formatModelName,
        
        // Model management
        availableModels,
        modelDownloading,
        pullProgress,
        modelDetails,
        runningModels,
        downloadingModels,
        getModelDownloadStatus,
        downloadModel,
        getRunningModels,
        resumeDownloads,
        cancelModelDownload,
        deleteModel,
        getAvailableModels,
        getModelInformation,
        isModelLoaded,
        loadModel,

        // Ollama server management
        isOllamaRunning,
        isOllamaConfigured,
        restartingOllama,
        downloadOllama: ollamaService.downloadOllama,
        configureAndRestartOllama,
        checkOllamaStatus,
        isOllamaProvider,
        updateHost,
    };
}
