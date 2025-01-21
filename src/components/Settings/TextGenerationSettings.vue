<template>
    <q-list>
        <q-item>
            <q-item-section avatar>
                <q-icon :name="mdiCreation" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label caption>{{ t('settings.text.model.label') }}</q-item-label>
                <q-select v-model="model" :options="modelOptions" emit-value dense options-dense>
                    <template v-slot:option="{ itemProps, opt }">
                        <q-item v-bind="itemProps">
                            <q-item-section>
                                <q-item-label>{{ opt.label }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-item-label caption>{{ opt.provider }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </template>
                    <template v-slot:append>
                        <q-item-label caption class="q-pr-sm">
                            {{ modelOptions.find(opt => opt.value === model)?.provider }}
                        </q-item-label>
                    </template>
                </q-select>
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.text.model.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="maxTokens < 1024 ? mdiTextShort : maxTokens < 2048 ? mdiText : mdiTextLong"
                    :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label caption>{{ t('settings.text.maxTokens.label') }} ({{ maxTokens
                    }})</q-item-label>
                <q-slider :model-value="maxTokens" @change="val => { maxTokens = val }" :min="64" :max="4096" :step="16"
                    :markers="1024" label />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.text.maxTokens.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="mdiThermometer" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label caption>{{ t('settings.text.temperature.label') }} ({{ temperature
                    }})</q-item-label>
                <q-slider :model-value="temperature" @change="val => { temperature = val }" :min="0" :max="2"
                    :step="0.1" :markers="0.5" label />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.text.temperature.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <!-- Persona selection -->
        <q-separator v-if="appMode == 'advanced'" />

        <q-item v-if="appMode == 'advanced'">
            <q-item-section avatar>
                <q-icon :name="mdiCardAccountDetailsOutline" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label>{{ t('settings.text.personas.label') }}</q-item-label>
                <q-item-label caption>{{ $t('settings.text.personas.caption') }}</q-item-label>
                <q-select dense options-dense use-input input-debounce="0" use-chips multiple
                    :option-label="(item) => item === null ? 'Null value' : item.name" :options="personaOptions"
                    v-model="personas" @filter="personaFilterFn">

                    <template v-slot:selected-item="scope">
                        <q-chip dense size="sm" class="q-ma-none" removable @remove="scope.removeAtIndex(scope.index)"
                            color="primary">
                            <q-avatar size="sm">
                                <img v-if="scope.opt.avatar" :src="scope.opt.avatar" />
                                <q-icon v-else :name="mdiAccountCircle" size="sm" />
                            </q-avatar>
                            {{ scope.opt.name }}
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ scope.opt.prompt }}
                            </q-tooltip>
                        </q-chip>
                    </template>

                    <template v-slot:option="scope">
                        <q-item v-bind="scope.itemProps">
                            <q-item-section avatar>
                                <q-avatar size="sm">
                                    <img v-if="scope.opt.avatar" :src="scope.opt.avatar" />
                                    <q-icon v-else :name="mdiAccountCircle" size="sm" />
                                </q-avatar>
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ scope.opt.name }}</q-item-label>
                            </q-item-section>
                            <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                                {{ scope.opt.prompt }}
                            </q-tooltip>
                        </q-item>
                    </template>

                </q-select>
            </q-item-section>
        </q-item>
    </q-list>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from "pinia";
import { useHelpers } from '@/composables/useHelpers';
import { mdiCreation, mdiTextShort, mdiText, mdiTextLong, mdiThermometer, mdiAccountCircle, mdiCardAccountDetailsOutline } from '@quasar/extras/mdi-v7';
import { useSettingsStore } from '@/stores/settings-store.js';
import { useTeamsStore } from '@/stores/teams-store.js';
import { useOllama } from '@/composables/useOllama';

const { iconColor } = useHelpers();
const { availableModels, isOllamaRunning, isOllamaProvider, checkOllamaStatus } = useOllama();

const { t } = useI18n();
const settingsStore = useSettingsStore();
const {
    appMode,
    apiProviders,
    model,
    maxTokens,
    temperature,
    personas,
} = storeToRefs(settingsStore);

const teamsStore = useTeamsStore();
const personaOptions = ref(teamsStore.personas);

// Filters personas based on input characters in the select box
function personaFilterFn(val, update) {
    if (val === '') {
        update(() => personaOptions.value = teamsStore.personas);
        return;
    }

    update(() => {
        const needle = val.toLowerCase();
        personaOptions.value = teamsStore.personas.filter(v => v.name.toLowerCase().indexOf(needle) > -1);
    });
}

// Computed array of { providers, models } to use in select options
const modelOptions = computed(() => {
    // First create array with all models
    const allModels = apiProviders.value.map(provider => {
        // For Ollama provider, only include models if ollama server is connected and models are downloaded
        if (isOllamaProvider(provider.name)) {
            if (!isOllamaRunning.value || availableModels.value.length === 0) {
                return [];
            }
            return availableModels.value.map(model => ({
                "label": model,
                "provider": provider.name,
                "value": model
            }));
        }
        // For other providers, use their configured models
        return provider.models.map(model => ({
            "label": model,
            "provider": provider.name,
            "value": model
        }));
    }).flat();

    // Remove duplicates and sort
    return Array.from(new Set(allModels.map(obj => JSON.stringify(obj))))
        .map(str => JSON.parse(str))
        .sort((a, b) => a.label.localeCompare(b.label));
});


// Get Ollama provider config
const ollamaProvider = computed(() => 
    apiProviders.value.find(p => isOllamaProvider(p.name))
);

onMounted(async () => {
    if (ollamaProvider.value) {
        await checkOllamaStatus(ollamaProvider.value);
    }
});

</script>

<style scoped>
/* Your existing styles here */
</style>