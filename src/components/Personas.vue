<template>
    <q-card style="width: 80%">
        <q-card-section>
            <div class="text-h6">
                {{ t('personas.title') }}
            </div>
            {{ t('personas.description') }}
        </q-card-section>

        <q-separator inset />

        <q-card-section>
            <q-list>
                <q-item>
                    <q-item-section>
                        <q-item-label>{{ t('personas.actions.add.label') }}</q-item-label>
                        <q-item-label caption>{{ t('personas.actions.add.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-btn dense flat icon="mdi-account-plus-outline" :color="iconColor" @click="">
                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ t('personas.actions.add.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                    </q-item-section>
                </q-item>
                <q-item>
                    <q-item-section>
                        <q-item-label>{{ t('personas.actions.import.label') }}</q-item-label>
                        <q-item-label caption>{{ t('personas.actions.import.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-btn dense flat icon="mdi-account-arrow-down-outline" :color="iconColor" @click="importPersonas">
                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ t('personas.actions.import.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card-section>

        <div v-if="personas.length != 0">
            <q-separator inset />

            <q-card-section>
                <q-markup-table wrap-cells>
                    <thead>
                        <tr class="text-left">
                            <th>{{ t('personas.tableHeading.name') }}</th>
                            <th colspan="2">{{ t('personas.tableHeading.prompt') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="persona in personas" :key="persona.persona">
                            <td>{{ persona.persona }}</td>
                            <td>{{ persona.prompt }}</td>
                            <td>
                                <q-btn dense flat icon="mdi-pencil-outline" :color="iconColor" @click="" />
                                <q-btn dense flat icon="mdi-delete-outline" :color="iconColor" @click="deletePersona(persona)" />
                            </td>
                        </tr>
                        <tr v-for="persona in awesomePrompts" :key="awesomePrompts.persona">
                            <td>{{ persona.persona }}</td>
                            <td>{{ persona.prompt }}</td>
                            <td>
                                <q-btn dense flat icon="mdi-account-plus-outline" :color="iconColor" @click="addAwesomePrompt(persona)" />
                            </td>
                        </tr>
                    </tbody>
                </q-markup-table>
            </q-card-section>
        </div>
    </q-card>
</template>

<script>

import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useTeamsStore } from '../stores/teams-store.js';
import { storeToRefs } from 'pinia';

export default {
    name: 'Personas',
    setup() {
        const { t } = useI18n();
        const $q = useQuasar();

        const teamsStore = useTeamsStore();
        const { personas } = storeToRefs(teamsStore);
        const awesomePrompts = ref([]);

        const importPersonas = () => {
            fetch("https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv")
                .then(response => response.text())
                .then(data => {
                    awesomePrompts.value = data.toString()
                        .split("\n")
                        .map(row => {
                            let [persona, prompt] = row.split(",").map(item => item.trim().replace(/^"|"$/g, ''));
                            return { persona, prompt };
                        });
                        awesomePrompts.value.shift();
                })
                .catch(error => console.error(error))
                .finally(() => console.log("done"));
        }

        const addAwesomePrompt = (persona) => {
            awesomePrompts.value = awesomePrompts.value.filter(item => item.persona != persona.persona);
            personas.value.push(persona);
        }

        const deletePersona = (persona) => {
            personas.value = personas.value.filter(item => item.persona != persona.persona);
        }

        return {
            t,
            personas,
            awesomePrompts,
            importPersonas,
            
            deletePersona,
            addAwesomePrompt,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style></style>
