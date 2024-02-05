import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';
import { imageDB } from './localforage.js';
import logger from './logger.js';

const openAI = () => {
    const settingsStore = useSettingsStore()
    const { apiKey, model, maxTokens, temperature, imageSize, imageQuality, imageStyle } = storeToRefs(settingsStore);

    // Private function. Sets the fetch init options.
    const setOptions = (messages, stream, abortSignal) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey.value,
        };

        const body = {
            "model": model.value,
            "messages": messages,
            "max_tokens": maxTokens.value,
            "temperature": temperature.value,
            "stream": stream,
            "n": 1
        };

        const options = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            signal: abortSignal
        }

        return options;
    }

    // Public function. Creates a chat completion.
    const createChatCompletion = async (messages, stream, abortSignal) => {
        // Clean up any undefined elements in the messages array, to avoid failed OpenAI API call.
        messages = messages.filter(message => message !== undefined);

        const requestOptions = setOptions(messages, stream, abortSignal);

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", requestOptions);
            if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);

            return response;

        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Public function. Creates an image given a user prompt.
    const createImageCompletion = async (prompt) => {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey.value
            },
            body: JSON.stringify({
                "model": "dall-e-3",
                "prompt": prompt,
                "size": imageSize.value,
                "quality": imageQuality.value,
                "style": imageStyle.value,
                "response_format": "b64_json"
            })
        };

        try {
            let choices = [];

            const response = await fetch("https://api.openai.com/v1/images/generations", requestOptions);
            if (!response.ok) {
                throw new Error(`${response.status} - ${response.statusText}`);
            }

            const json = await response.json();
            if (json.errorCode) throw new Error(`${data.errorCode}`);

            // todo: UX performance improvement: don't wait for all images to be done
            //       1. Measure time spent in for loop.
            for (let i = 0; i < json.data.length; i++) {

                let imageB64 = "data:image/png;base64," + json.data[i].b64_json;
                let imageName = `image-${json.created}-${i}`;

                choices.push({ index: i, content: imageName });

                try {
                    // Create blob from base64 image and store it in imageDB
                    let response = await fetch(imageB64);
                    let blob = await response.blob();
                    await imageDB.setItem(imageName, blob);

                    // todo: Generate image thumbnail

                } catch (error) {
                    logger.error(error);
                }
            }
            return {
                role: "assistant",
                object: "image",
                choices: choices,
                settings: {
                    model: "dall-e-3",
                    choices: choices.length,
                    imageSize: imageSize.value,
                    imageQuality: imageQuality.value,
                    imageStyle: imageStyle.value
                }
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Public functions
    return {
        createChatCompletion,
        createImageCompletion
    }
}

export default openAI;