import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { Command } from '@tauri-apps/plugin-shell';
import { platform } from '@tauri-apps/plugin-os';
import { ollamaService } from '@/services/ollama.service';

export function useOllama() {
    const $q = useQuasar();
    const availableModels = ref([]);
    const modelDownloading = ref({});
    const pullProgress = ref(0);
    const modelDetails = ref({});
    const loadingDetails = ref({});
    const runningModels = ref({});
    const isOllamaConnected = ref(false);
    const isOllamaConfigured = ref(false);
    const restartingOllama = ref(false);

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

    // Pull specific model
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
                if (progress > pullProgress.value) {
                    pullProgress.value = progress;
                }
            });
            await loadAvailableModels();
            
            $q.notify({
                type: 'positive',
                message: `Model ${modelName} downloaded successfully`
            });

            return true;
        } catch (error) {
            console.error(`Failed to pull model ${modelName}:`, error);
            $q.notify({
                type: 'negative',
                message: `Failed to pull model ${modelName}: ${error.message}`
            });
            return false;
        } finally {
            modelDownloading.value[modelName] = false;
            pullProgress.value = 0;
        }
    }

    // Delete model
    async function deleteModel(modelName) {
        if (!modelName) {
            console.error('No model name provided for deletion');
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
            
            $q.notify({
                type: 'positive',
                message: `Model ${base} and all its versions deleted successfully`
            });
            return true;
        } catch (error) {
            console.error(`Failed to delete model ${modelName}:`, error);
            $q.notify({
                type: 'negative',
                message: `Failed to delete model ${modelName}: ${error.message}`
            });
            return false;
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
            console.error(`Failed to load details for model ${modelName}:`, error);
            $q.notify({
                type: 'negative',
                message: `Failed to load model details: ${error.message}`
            });
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
            console.error('Failed to load models:', error);
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
            console.error('Failed to check model status:', error);
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

            console.log('Successfully configured and restarted Ollama');
        } catch (error) {
            console.error('Failed to configure and restart Ollama:', error);
        } finally {
            restartingOllama.value = false;
        }
    }

    async function checkOllamaStatus(provider) {
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
        checkOllamaStatus
    };
}
