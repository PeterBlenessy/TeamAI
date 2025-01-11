import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { Command } from '@tauri-apps/plugin-shell';
import { platform } from '@tauri-apps/plugin-os';
import { ollamaService } from '@/services/ollama.service';
import { useSettingsStore } from '@/stores/settings-store';
import logger from '@/services/logger';

export function useOllama() {
    const $q = useQuasar();
    const settingsStore = useSettingsStore();

    // Initialize refs
    const availableModels = ref([]);
    const modelDownloading = ref({});
    const pullProgress = ref(0);
    const modelDetails = ref({});
    const loadingDetails = ref({});
    const runningModels = ref({});
    const isOllamaConnected = ref(false);
    const isOllamaConfigured = ref(false);
    const restartingOllama = ref(false);

    // Replace downloadingModels ref with store reference
    const downloadingModels = computed(() => settingsStore.downloadingModels);

    const addDownloadingModel = (modelName) => {
        settingsStore.downloadingModels.push({
            name: modelName,
            progress: 0
        });
    };

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
    };

    // Remove window.addEventListener('beforeunload') handler as it's no longer needed

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

    // Get model status
    function getModelStatus(modelName) {
        if (!modelName) return { downloaded: false, downloading: false };
        const { base } = getBaseName(modelName);
        return {
            downloaded: availableModels.value.some(m => getBaseName(m).base === base),
            downloading: !!modelDownloading.value[modelName]
        };
    }

    async function resumeDownloads() {
        logger.info(`Resuming downloads: ${JSON.stringify(settingsStore.downloadingModels)}`);
        for (const model of settingsStore.downloadingModels) {
            // Re-trigger pull for each downloading model
            pullSpecificModel(model.name, true);
        }
    }

    // Remove the downloadIterators map and modify pullSpecificModel to only handle progress
    async function pullSpecificModel(modelName, isResume = false) {
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

            await loadAvailableModels();
            removeDownloadingModel(modelName);
            return true;
        } catch (error) {
            logger.error(`Failed to pull model ${modelName}: ${error}`);
            removeDownloadingModel(modelName);
            throw error;
        } finally {
            modelDownloading.value[modelName] = false;
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

            await loadAvailableModels();

            return true;
        } catch (error) {
            logger.error(`Failed to delete model ${modelName}: ${error}`);
            throw new Error(`Failed to delete model ${modelName}: ${error.message}`);
        }
    }

    // Load model details
    async function loadModelDetails(modelName) {
        if (loadingDetails.value[modelName]) return;
        
        loadingDetails.value[modelName] = true;
        try {
            const details = await ollamaService.showModel(modelName);
            modelDetails.value[modelName] = details;
        } catch (error) {
            logger.error(`Failed to load details for model ${modelName}: ${error}`);
            throw new Error(`Failed to load details for model ${modelName}: ${error.message}`);
        } finally {
            loadingDetails.value[modelName] = false;
        }
    }

    // Load available models
    async function loadAvailableModels() {
        try {
            const models = await ollamaService.listModels();
            availableModels.value = models;
            // Load details for all models
            for (const model of models) {
                await loadModelDetails(model);
            }
        } catch (error) {
            logger.error('Failed to load models:', error);
        }
    }

    // Load model
    async function loadModel(modelName) {
        if (await ollamaService.loadModel(modelName)) {
            runningModels.value[modelName] = true;
            return true;
        }
        return false;
    }

    async function isModelLoaded(modelName) {
        try {
            const runningModels = await ollamaService.ps();
            return runningModels.includes(modelName);
        } catch (error) {
            logger.error('Failed to check model status:', error);
            return false;
        }
    }

    // Generate model options
    function getAllModelOptions(tmpProvider, downloaded = []) {
        if (!tmpProvider?.name?.toLowerCase().includes('ollama')) {
            return tmpProvider?.models || [];
        }

        const preConfiguredModels = tmpProvider?.models || [];
        const modelMap = new Map();

        downloaded.forEach(model => {
            const { base } = getBaseName(model);
            modelMap.set(base, model);
        });

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
                downloaded: getModelStatus(model).downloaded
            }));
    }

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

    async function checkOllamaStatus(provider) {
        if (!provider) return;

        ollamaService.setHost(provider.baseUrl);

        isOllamaConnected.value = await ollamaService.checkConnection();
        logger.info(`Ollama connected: ${isOllamaConnected.value}`);
        if (isOllamaConnected.value) {
            isOllamaConfigured.value = await ollamaService.isConfiguredCorrectly();
            if (isOllamaConfigured.value) {
                loadAvailableModels();
            }
        }
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
        return providerName?.toLowerCase().includes('ollama');
    }

    return {
        availableModels,
        modelDownloading,
        pullProgress,
        modelDetails,
        runningModels,
        getBaseName,
        formatModelName,
        getModelStatus,
        pullSpecificModel,
        deleteModel,
        loadModelDetails,
        loadAvailableModels,
        loadModel,
        isModelLoaded,  // rename from displayModelStatus
        getAllModelOptions,
        isOllamaConnected,
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
