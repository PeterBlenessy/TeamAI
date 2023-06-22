import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';

const openAI = () => {
    const settingsStore = useSettingsStore()
    const { apiKey, model, maxTokens, choices, temperature } = storeToRefs(settingsStore);

    // Private function. Sets the fetch init options.
    const setOptions = (messages) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey.value,
        };

        const body = {
            "model": model.value,
            "messages": [
                { "role": "system", "content": "I am a helpful assistant" },
                ...messages
            ],
            "max_tokens": maxTokens.value,
            "temperature": temperature.value,
            "stream": false,
            "n": choices.value
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
        const requestOptions = setOptions(messages);

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", requestOptions);
            if (!response.ok) throw new Error(`${response.status} - ${response.statusText}`);

            const json = await response.json();
            if (json.errorCode) throw new Error(`${data.errorCode}`);

            return json.choices[0].message;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Public functions
    return {
        createChatCompletion
    }
}

export default openAI;