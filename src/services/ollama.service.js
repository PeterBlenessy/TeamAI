import { Ollama } from 'ollama/browser';
import { Command, open } from '@tauri-apps/plugin-shell';
import { platform } from '@tauri-apps/plugin-os';
import logger from '@/services/logger';

class OllamaService {
    constructor() {
        this.host = null;
        this.ollama = null;
        this.platformName = platform();
        logger.info(`[OllamaService] - Initialized for platform: ${this.platformName}`);
    }

    setHost(baseUrl) {
        // Remove /v1 suffix if present
        this.host = baseUrl.replace(/\/v1\/?$/, '');
        // Create Ollama instance with normalized URL
        this.ollama = new Ollama({ 
            host: this.host,
            // The Ollama package will append /v1 where needed
        });

        logger.info(`[OllamaService] - Host set to: ${this.host}`);
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
            let lastProgress = 0;
            const stream = await this.ollama.pull({ 
                model: modelName, 
                stream: true 
            });

            for await (const part of stream) {
                if (part.digest) {
                    if (part.completed && part.total) {
                        const progress = Math.round((part.completed / part.total) * 100);
                        if (progress !== lastProgress) {  // Only update if changed
                            lastProgress = progress;
                            onProgress(progress);
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('[OllamaService] - Failed to pull model:', error);
            throw error;
        }
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
            logger.error(`[OllamaService] - Failed to delete model:`, error);
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
            logger.error(`[OllamaService] - Failed to get model details:`, error);
            throw error;
        }
    }

    async downloadOllama() {
        logger.info('[OllamaService] - Opening Ollama download page');
        await open('https://ollama.com/download');
    }

    async loadModel(modelName) {
        if (!modelName) return false;
        try {
            // Attempt a short generation to verify if model is actually loaded
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
