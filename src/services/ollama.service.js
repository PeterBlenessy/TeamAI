import { Ollama } from 'ollama/browser';
import { Command, open } from '@tauri-apps/plugin-shell';
import { platform } from '@tauri-apps/plugin-os';
import logger from '@/services/logger';

const DEFAULT_HOST = 'http://localhost:11434';

class OllamaService {
    constructor() {
        this.platformName = platform();
        this.downloadStreams = new Map();
        this._initialize(DEFAULT_HOST);
        logger.info(`[OllamaService] - Initialized for platform: ${this.platformName}`);
    }

    _initialize(baseUrl) {
        this.host = baseUrl.replace(/\/v1\/?$/, '');
        this.ollama = new Ollama({ host: this.host });
    }

    setHost(baseUrl) {
        if (!baseUrl) return;
        if (baseUrl === this.host) return;
        
        this._initialize(baseUrl);
        logger.info(`[OllamaService] - Host updated to: ${this.host}`);
    }

    async initializeWithProvider(provider) {
        if (!provider) return false;
        if (!this.isOllamaProvider(provider.name)) return false;

        this.setHost(provider.baseUrl);
        return await this.checkConnection();
    }

    isOllamaProvider(providerName) {
        return providerName?.toLowerCase().includes('ollama');
    }

    async checkConnection() {
        try {
            // First try to call the API
            const models = await this.ollama.list();
            logger.info('[OllamaService] - Connection successful');
            return { isRunning: true, needsConfig: false };
        } catch (error) {
            logger.info('[OllamaService] - API call failed, trying to start Ollama');
            
            // API failed, try to start Ollama
            try {
                await this.startOllamaServer();
                // Wait for server to initialize
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try API call again
                const models = await this.ollama.list();
                logger.info('[OllamaService] - Started successfully');
                return { isRunning: true, needsConfig: false };
            } catch (startError) {
                logger.info('[OllamaService] - Failed to start, probably not installed');
                // If we can't start it, it's probably not installed
                return { isRunning: false, needsConfig: false };
            }
        }
    }

    async startOllamaServer() {
        const command = new Command(this.platformName === 'windows' ? 'cmd' : 'open');
        
        if (this.platformName === 'windows') {
            await command.execute(['/C', 'start', '', 'ollama']);
        } else if (this.platformName === 'macos') {
            await command.execute(['-a', 'Ollama']);
        } else {
            await command.execute(['ollama', 'serve']);
        }
    }

    async isConfiguredCorrectly() {
        try {
            // Try to list models with a different origin to test CORS
            const testOllama = new Ollama({ 
                host: this.host,
                headers: { 'Origin': 'http://invalid.origin' }
            });
            await testOllama.list();
            return true;
        } catch {
            return false;
        }
    }

    async listModels() {
        try {
            const response = await this.ollama.list();
            return response.models.map(model => model.name);
        } catch (error) {
            console.error('Failed to list models:', error);
            throw error;
        }
    }

    async pullModel(modelName, onProgress) {
        try {
            const stream = await this.ollama.pull({ 
                model: modelName, 
                stream: true 
            });

            // Store the steams to be able to cancel them
            this.downloadStreams.set(modelName, stream);

            for await (const part of stream) {
                if (part.digest) {
                    if (part.completed && part.total) {
                        const progress = Math.round((part.completed / part.total) * 100);
                        onProgress(progress);
                    }
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
            this.downloadStreams.delete(modelName);
        }
    }

    cancelModelDownload(modelName) {
        const stream = this.downloadStreams.get(modelName);
        if (stream) {
            stream.abort();
            this.downloadStreams.delete(modelName);
            return true;
        }
        return false;
    }

    async deleteModel(modelName) {
        try {
            logger.info(`[OllamaService] - Attempting to delete model: ${modelName}`);
            if (!modelName) {
                throw new Error('Model name is required');
            }

            // Use 'model' instead of 'name' in the parameter object
            await this.ollama.delete({
                model: modelName
            });
            
            logger.info(`[OllamaService] - Model ${modelName} deleted successfully`);
        } catch (error) {
            logger.error(`[OllamaService] - Failed to delete model: ${error}`);
            throw error;
        }
    }

    async showModel(modelName) {
        try {
            logger.info(`[OllamaService] - Getting details for model: ${modelName}`);
            if (!modelName) {
                throw new Error('Model name is required');
            }

            const response = await this.ollama.show({
                model: modelName
            });
            
            logger.info(`[OllamaService] - Got details for model ${modelName}`);
            return response;
        } catch (error) {
            logger.error(`[OllamaService] - Failed to get model details: ${error}`);
            throw error;
        }
    }

    async downloadOllama() {
        logger.info('[OllamaService] - Opening Ollama download page');
        await open('https://ollama.com/download');
    }

    async ps() {
        try {
            const response = await this.ollama.ps();
            return response.models.map(model => model.name);
        } catch (error) {
            logger.error(`[OllamaService] - Failed to get running models: ${error}`);
            throw error;
        }
    }

    async loadModel(modelName) {
        if (!modelName) return false;
        try {
            // Check if model is already loaded using ps()
            const runningModels = await this.ps();
            if (runningModels.includes(modelName)) {
                return true;
            }
            // If not loaded, attempt to load it
            await this.ollama.generate({
                model: modelName,
                prompt: '', 
                stream: false
            });
            return true;
        } catch {
            return false;
        }
    }
}

export const ollamaService = new OllamaService();
