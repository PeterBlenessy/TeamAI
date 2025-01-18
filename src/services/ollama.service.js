import { Ollama } from 'ollama/browser';
import { Command, open } from '@tauri-apps/plugin-shell';
import { platform } from '@tauri-apps/plugin-os';
import logger from '@/services/logger';

function createOllamaService(baseUrl) {

    // Private state
    const state = {
        platformName: null,
        downloadStreams: new Map(),
        host: null,
        ollama: null,
        initialized: false
    };

    // Private methods
    const initialize = () => {
        if (state.initialized || !baseUrl) {
            logger.warn('[OllamaService] - No valid baseUrl provided');
            return;
        }
        
        state.platformName = platform();
        state.host = baseUrl.replace(/\/v1\/?$/, '');
        state.ollama = new Ollama({ host: state.host });
        state.initialized = true;
        logger.info(`[OllamaService] - Initialized for platform: ${state.platformName} with host: ${state.host}`);
    };

    // Initialize immediately with provided configuration
    initialize();

    // Public interface implementation

    const setHost = (baseUrl) => {
        if (!baseUrl || baseUrl === state.host) return;
        state.host = baseUrl.replace(/\/v1\/?$/, '');
        state.ollama = new Ollama({ host: state.host });
        logger.info(`[OllamaService] - Host updated to: ${state.host}`);
    };

    const isOllamaProvider = (providerName) => {
        return providerName?.toLowerCase().includes('ollama');
    };

    const checkConnection = async () => {
        try {
            await state.ollama.list();
            logger.info('[OllamaService] - Connection successful');
            return { isRunning: true, needsConfig: false };
        } catch (error) {
            logger.info('[OllamaService] - API call failed, trying to start Ollama');
            
            try {
                await startOllamaServer();
                await new Promise(resolve => setTimeout(resolve, 2000));
                await state.ollama.list();
                logger.info('[OllamaService] - Started successfully');
                return { isRunning: true, needsConfig: false };
            } catch (startError) {
                logger.info('[OllamaService] - Failed to start, probably not installed');
                return { isRunning: false, needsConfig: false };
            }
        }
    };

    const startOllamaServer = async () => {
        const command = new Command(state.platformName === 'windows' ? 'cmd' : 'open');
        
        if (state.platformName === 'windows') {
            await command.execute(['/C', 'start', '', 'ollama']);
        } else if (state.platformName === 'macos') {
            await command.execute(['-a', 'Ollama']);
        } else {
            await command.execute(['ollama', 'serve']);
        }
    };

    const isConfiguredCorrectly = async () => {
        try {
            const testOllama = new Ollama({ 
                host: state.host,
                headers: { 'Origin': 'http://invalid.origin' }
            });
            await testOllama.list();
            return true;
        } catch {
            return false;
        }
    };

    const listModels = async () => {
        try {
            const response = await state.ollama.list();
            return response.models.map(model => model.name);
        } catch (error) {
            logger.error('[OllamaService] - Failed to list models:', error);
            throw error;
        }
    };

    const pullModel = async (modelName, onProgress) => {
        try {
            const stream = await state.ollama.pull({ 
                model: modelName, 
                stream: true 
            });

            state.downloadStreams.set(modelName, stream);

            for await (const part of stream) {
                if (part.digest && part.completed && part.total) {
                    const progress = Math.round((part.completed / part.total) * 100);
                    onProgress(progress);
                }
            }
        } catch (error) {
            if (error?.name === 'AbortError') {
                logger.info(`[OllamaService] - Download cancelled for model: ${modelName}`);
            } else {
                logger.error(`[OllamaService] - Failed to pull model: ${error}`);
                throw error;
            }
        } finally {
            state.downloadStreams.delete(modelName);
        }
    };

    const cancelModelDownload = (modelName) => {
        const stream = state.downloadStreams.get(modelName);
        if (stream) {
            stream.abort();
            state.downloadStreams.delete(modelName);
            return true;
        }
        return false;
    };

    const deleteModel = async (modelName) => {
        try {
            logger.info(`[OllamaService] - Attempting to delete model: ${modelName}`);
            if (!modelName) {
                throw new Error('Model name is required');
            }

            await state.ollama.delete({
                model: modelName
            });
            
            logger.info(`[OllamaService] - Model ${modelName} deleted successfully`);
        } catch (error) {
            logger.error(`[OllamaService] - Failed to delete model: ${error}`);
            throw error;
        }
    };

    const showModel = async (modelName) => {
        try {
            if (!modelName) {
                throw new Error('Model name is required');
            }

            const response = await state.ollama.show({
                model: modelName
            });
            
            return response;
        } catch (error) {
            logger.error(`[OllamaService] - Failed to get model details: ${error}`);
            throw error;
        }
    };

    const downloadOllama = async () => {
        logger.info('[OllamaService] - Opening Ollama download page');
        await open('https://ollama.com/download');
    };

    const ps = async () => {
        try {
            const response = await state.ollama.ps();
            return response.models.map(model => model.name);
        } catch (error) {
            logger.error(`[OllamaService] - Failed to get running models: ${error}`);
            throw error;
        }
    };

    const loadModel = async (modelName) => {
        if (!modelName) return false;
        try {
            const runningModels = await ps();
            if (runningModels.includes(modelName)) {
                return true;
            }
            await state.ollama.generate({
                model: modelName,
                prompt: '', 
                stream: false
            });
            return true;
        } catch (error) {
            logger.warn(`[OllamaService] - Model load failed: ${modelName}`);
            return false;
        }
    };

    // Public interface
    return {
        setHost,
        isOllamaProvider,
        checkConnection,
        startOllamaServer,
        isConfiguredCorrectly,
        listModels,
        pullModel,
        cancelModelDownload,
        deleteModel,
        showModel,
        downloadOllama,
        ps,
        loadModel
    };
}

export default createOllamaService;
