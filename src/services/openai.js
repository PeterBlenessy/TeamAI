import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';

const openAI = () => {
    const settingsStore = useSettingsStore()
    const { apiKey, model, maxTokens, temperature, choices, imageSize } = storeToRefs(settingsStore);

    // Private function. Sets the fetch init options.
    const setOptions = (messages) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey.value,
        };

        const body = {
            "model": model.value,
            "messages": messages,
            "max_tokens": maxTokens.value,
            "temperature": temperature.value,
            "stream": false,
            "n": 1
        };

        const options = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        }

        return options;
    }

    // Public function. Creates a chat completion.
    const createChatCompletion = async (messages) => {
        // Clean up any undefined elements in the messages array, to avoid failed OpenAI API call.
        messages = messages.filter(message => message !== undefined);

        const requestOptions = setOptions(messages);

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", requestOptions);
            if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);

            const json = await response.json();
            if (json.errorCode) throw new Error(`${data.errorCode}`);

            return {
                role: json.choices[0].message.role,
                content: json.choices[0].message.content,
                object: json.object,
                usage: json.usage,
                apiParameters: {
                    model: model.value,
                    maxTokens: maxTokens.value,
                    temperature: temperature.value
                }
            };
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
                "prompt": prompt,
                "n": choices.value,
                "size": imageSize.value,
                "response_format": "b64_json"
            })
        };

        try {
            const response = await fetch("https://api.openai.com/v1/images/generations", requestOptions);
            if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);

            const json = await response.json();
            if (json.errorCode) throw new Error(`${data.errorCode}`);

            let choices = [];
            for (let i = 0; i < json.data.length; i++) {
                choices.push({ index: i, content: "data:image/png;base64,"+json.data[i].b64_json });
            }
                //apiParameters: {model, maxTokens, temperature } | {choices, imageSize}

            return {
                role: "assistant",
                object: "image",
                choices: choices,
                apiParameters: {
                    model: "dall-e",
                    choices: choices.length,
                    imageSize: imageSize.value
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