<template>
    <q-card style="min-width: 60%; max-width: 70%">
        <q-card-section>
            <div class="text-h6">
                {{ t('personas.title') }}
            </div>
            {{ t('personas.description') }}
        </q-card-section>

        <q-separator />

        <q-card-section>
            <q-list>
                <q-item>
                    <q-item-section>
                        <q-item-label>{{ t('personas.actions.create.label') }}</q-item-label>
                        <q-item-label caption>{{ t('personas.actions.create.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-btn dense flat icon="mdi-account-plus-outline" :color="iconColor" @click="createNewPersona()">
                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ t('personas.actions.create.tooltip') }}
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
                        <q-btn dense flat :color="iconColor" 
                            @click="awesomePrompts.length == 0 ? fetchAwesomePrompts() : deleteAwesomePrompts()"
                            :icon="awesomePrompts.length == 0 ? 'mdi-account-arrow-down-outline':'mdi-account-cancel-outline'">

                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ awesomePrompts.length == 0 ? t('personas.actions.import.tooltip') : t('personas.actions.delete.tooltip') }}
                            </q-tooltip>    
                        </q-btn>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card-section>

        <!-- Show the table if there is something to show -->
        <div v-if="personas.length != 0 || awesomePrompts.length != 0">
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
                        <tr v-for="persona in personas" :key="persona.id">
                            <td width="25%">
                                <q-input borderless dense autogrow style="width: 100%;"
                                    :input-style="persona.readonly ? { cursor: 'default' } : { cursor: 'text' }"
                                    :readonly="persona.readonly" :focus="!persona.readonly" v-model="persona.name" />
                            </td>
                            <td colspan="2">
                                <q-input borderless dense autogrow style="width: 100%;"
                                    :input-style="persona.readonly ? { cursor: 'default' } : { cursor: 'text' }"
                                    :readonly="persona.readonly" :focus="!persona.readonly" v-model="persona.prompt" >

                                    <template v-slot:append>
                                        <q-btn size="sm" flat dense 
                                            :color="persona.readonly ? iconColor : 'primary'"
                                            :icon="persona.readonly ? 'mdi-pencil-outline' : 'mdi-content-save-outline'"
                                            :disabled="persona.id==0"
                                            @click="persona.readonly = !persona.readonly">

                                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                                {{ persona.readonly ? $t('personas.actions.edit.tooltip') :
                                                    $t('personas.actions.save.tooltip')
                                                }}
                                            </q-tooltip>
                                        </q-btn>
                                        <q-btn size="sm" dense flat icon="mdi-delete-outline" :color="iconColor"
                                            :disabled="persona.id==0"
                                            @click="deletePersona(persona)">
                                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                                {{ $t('personas.actions.delete.tooltip') }}
                                            </q-tooltip>
                                        </q-btn>

                                    </template>
                                </q-input>

                            </td>
                        </tr>
                        <tr v-for="persona in awesomePrompts" :key="awesomePrompts.id">
                            <td>{{ persona.name }}</td>
                            <td>{{ persona.prompt }}</td>
                            <td>
                                <q-btn dense flat icon="mdi-account-plus-outline" :color="iconColor"
                                    @click="addAwesomePrompt(persona)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                                {{ $t('personas.actions.add.tooltip') }}
                                            </q-tooltip>
                                        </q-btn>
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

        const fetchAwesomePrompts = () => {
            fetch("https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv")
                .then(response => response.text())
                .then(data => {
                    awesomePrompts.value = data.toString()
                        .split("\n")
                        .map((row, index) => {
                            let id = Date.now().toString() + index.toString();
                            let readonly = true;
                            let [name, prompt] = row.split('","').map(item => item.trim().replace(/^"|"$/g, ''));
                            return { id, name, prompt, readonly };
                        });
                    awesomePrompts.value.shift();
                })
                .catch(error => console.error(error))
                .finally(() => console.log("fetchPersonas() done"));
        }

        const addAwesomePrompt = (persona) => {
            awesomePrompts.value = awesomePrompts.value.filter(item => item.id != persona.id);
            personas.value.push(persona);
        }

        function createNewPersona() {
            let persona = {
                id: Date.now().toString(),
                name: t('personas.actions.create.name'),
                prompt: t('personas.actions.create.prompt'),
                readonly: false
            };
            personas.value.push(persona);
        }

        return {
            t,
            personas,
            awesomePrompts,

            addAwesomePrompt,
            createNewPersona,
            deleteAwesomePrompts: () => awesomePrompts.value = [],
            deletePersona: (persona) => personas.value = personas.value.filter(item => item.id != persona.id),
            fetchAwesomePrompts,

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style></style>
