<template>
    <q-list>

        <q-item>
            <q-item-section avatar>
                <q-icon name="mdi-brain" :color="iconColor" />
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
                </q-select>
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.text.model.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="maxTokens < 1024 ? 'mdi-text-short' : maxTokens < 2048 ? 'mdi-text' : 'mdi-text-long'"
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
                <q-icon name="mdi-thermometer" :color="iconColor" />
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
                <q-icon name="mdi-card-account-details-outline" :color="iconColor" />
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
                                <q-icon v-else name="mdi-account-circle" size="sm" />
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
                                    <q-icon v-else name="mdi-account-circle" size="sm" />
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

<script>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../stores/settings-store.js';
import { useTeamsStore } from '../stores/teams-store.js';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import defaultProviders from '../services/providers.config.json';

export default {
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const settingsStore = useSettingsStore();
        const {
            appMode,
            apiProviders,
            model,
            maxTokens,
            temperature,
            choices,
            personas,
            streamResponse
        } = storeToRefs(settingsStore);

        const teamsStore = useTeamsStore();
        const personaOptions = ref([...new Set( teamsStore.personas)]);

        watch(personaOptions, () => console.log(personaOptions.value));
        watch(personas, () => console.log(personas.value));

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
            return apiProviders.value.map(provider => {
                return provider.models.map(model => ({
                    "label": model,
                    "provider": provider.name,
                    "value": model
                }));
            }).flat()
        });

        return {
            t,
            appMode,

            model,
            modelOptions,
            maxTokens,
            temperature,
            choices,

            personaOptions,
            personaFilterFn,
            personas,

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style scoped>
/* Your existing styles here */
</style>