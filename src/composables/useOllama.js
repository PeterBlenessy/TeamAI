import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { ollamaService } from '@/services/ollama.service';
import { useSettingsStore } from '@/stores/settings-store';
import logger from '@/services/logger';

export function useOllama(provider = null) {
    const $q = useQuasar();
    const settingsStore = useSettingsStore();
    
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
        logger.info(`Resuming downloads: ${JSON.stringify(settingsStore.downloadingModels)}`);
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
            logger.error(`Invalid model name: ${modelName}`);
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

            await getAvailableModels();
            return true;
        } catch (error) {
            logger.error(`Failed to pull model ${modelName}: ${error}`);
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
            logger.error(`Failed to cancel download: ${error}`);
            throw error;
        }
    }

    //--------------------------------------------------------------------------------
    // FUNCTIONS TO HANDLE MODEL OPERATIONS
    //--------------------------------------------------------------------------------

    // Delete model
    async function deleteModel(modelName) {
        if (!modelName) {
            logger.error('No model name provided for deletion');
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

            await getAvailableModels();

            return true;
        } catch (error) {
            logger.error(`Failed to delete model ${modelName}: ${error}`);
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
            logger.error(`Failed to load details for model ${modelName}: ${error}`);
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

            // Get information for all models
            for (const model of models) {
                await getModelInformation(model);
            }
        } catch (error) {
            logger.error('Failed to load models:', error);
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
            logger.error('Failed to check model status:', error);
            return false;
        }
    }

    // Generate a list of model objects with label, value, and downloaded status
    // for Quasar Select options
    function getAllModelOptions(provider, downloaded = []) {
        const modelMap = new Map();
        
        // Models which are pre-configured with the provider
        const preConfiguredModels = provider?.models || [];

        // Models which have been downloaded
        downloaded.forEach(model => {
            const { base } = getBaseName(model);
            modelMap.set(base, model);
        });

        // Add pre-configured models to the map, 
        // but only if they don't already exist in the map
        preConfiguredModels.forEach(model => {
            const { base } = getBaseName(model);
            if (!modelMap.has(base)) {
                modelMap.set(base, model);
            }
        });

        return Array.from(modelMap.values())
            .filter(model => model)
            .map(model => ({
                label: formatModelName(model),
                value: model,
                downloaded: getModelDownloadStatus(model).downloaded
            }));
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

            logger.info('Successfully configured and restarted Ollama');
        } catch (error) {
            logger.error(`Failed to configure and restart Ollama: ${error}`);
        } finally {
            restartingOllama.value = false;
        }
    }

    // Initialize the ollama service with provider configuration, and
    // check if the Ollama server is running and configured to be reachable
    async function checkOllamaStatus(providerConfig) {
        if (!providerConfig) return;

        const { isRunning, needsConfig } = await ollamaService.initializeWithProvider(providerConfig);
        isOllamaRunning.value = isRunning;
        isOllamaConfigured.value = !needsConfig;

        if (isOllamaRunning.value && isOllamaConfigured.value) {
            await getAvailableModels();
            await resumeDownloads();
        }

        return { isRunning, needsConfig };
    }

    // Add new function to get running models
    async function getRunningModels() {
        try {
            return await ollamaService.ps();
        } catch (error) {
            logger.error(`Failed to get running models: ${error}`);
            return [];
        }
    }

    function isOllamaProvider(providerName) {
        return ollamaService?.isOllamaProvider(providerName);
    }

    onMounted(async () => {
        if (provider) {
            await checkOllamaStatus(provider);
        }
    });

    return {
        availableModels,
        modelDownloading,
        pullProgress,
        modelDetails,
        runningModels,
        getBaseName,
        formatModelName,
        getModelDownloadStatus,
        downloadModel,
        deleteModel,
        getModelInformation,
        getAvailableModels,
        loadModel,
        isModelLoaded,  // rename from displayModelStatus
        getAllModelOptions,
        isOllamaRunning,
        isOllamaConfigured,
        restartingOllama,
        configureAndRestartOllama,
        checkOllamaStatus,
        getRunningModels,  // Add the new function to exports
        downloadingModels,
        resumeDownloads,  // Add the new function to exports
        cancelModelDownload,  // Add the new function to exports
        isOllamaProvider,
    };
}
