<template>
    <q-card style="min-width: 60%; max-width: 70%;">
        <q-card-section>
            <div class="text-h6">
                {{ t('personas.title') }}
            </div>
            {{ t('personas.description') }}
        </q-card-section>

        <q-separator />

        <q-card-section>
            <q-list>
                <q-item class="no-padding">
                    <q-expansion-item style="width: 100%;" v-model="newPersona.expanded"
                        expand-icon="mdi-account-plus-outline" expanded-icon="mdi-account-plus-outline"
                        :label="t('personas.actions.create.label')" :caption="t('personas.actions.create.caption')">
                        <q-card>
                            <q-card-section>
                                <q-input filled dense autogrow style="width: 100%;" v-model="newPersona.name"
                                    :label="t('personas.tableHeading.name')" />
                                <q-space />
                                <q-input filled dense autogrow style="width: 100%;" v-model="newPersona.prompt"
                                    :label="t('personas.tableHeading.prompt')">

                                    <template v-slot:append>
                                        <q-btn size="sm" flat dense :color="newPersona.readonly ? iconColor : 'primary'"
                                            icon="mdi-content-save-outline" @click="saveNewPersona()">

                                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                                {{ $t('personas.actions.save.tooltip') }}
                                            </q-tooltip>
                                        </q-btn>

                                    </template>

                                </q-input>
                            </q-card-section>
                        </q-card>
                    </q-expansion-item>
                </q-item>
                <q-item>
                    <q-item-section>
                        <q-item-label>{{ t('personas.actions.import.label') }}</q-item-label>
                        <q-item-label caption>{{ t('personas.actions.import.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-btn dense flat :color="awesomePrompts.length == 0 ? iconColor : 'primary'"
                            @click="awesomePrompts.length == 0 ? fetchAwesomePrompts() : deleteAwesomePrompts()"
                            :icon="awesomePrompts.length == 0 ? 'mdi-account-arrow-down-outline' : 'mdi-account-cancel-outline'">

                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ awesomePrompts.length == 0 ? t('personas.actions.import.tooltip') :
                                    t('personas.actions.delete.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card-section>

        <!-- Show the table if there is something to show -->
        <div v-if="awesomePrompts.length != 0">

            <q-separator inset />

            <q-card-section>

                <q-table dense wrap-cells :rows-per-page-options="[0]" :rowsPerPage="0" class="my-sticky-header-table"
                    :columns="columns" :rows="awesomePrompts" row-key="id" :filter="awesomePromptsfilter"
                    title="Awesome ChatGPT prompts">

                    <template v-slot:top-right>
                        <q-input filled dense debounce="300" v-model="awesomePromptsfilter"
                            :placeholder="t('personas.actions.search.placeholder')">
                            <template v-slot:append>
                                <q-icon name="search" />
                            </template>
                        </q-input>
                    </template>

                    <template v-slot:body-cell-prompt="props">
                        <q-td :props="props">
                            <div class="row">
                                <div class="col">{{ props.row.prompt }}</div>
                                <div class="col-auto">
                                    <q-btn size="sm" dense flat icon="mdi-account-plus-outline" :color="iconColor"
                                        @click="addAwesomePrompt(props.row)">
                                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                            {{ $t('personas.actions.add.tooltip') }}
                                        </q-tooltip>
                                    </q-btn>
                                </div>
                            </div>
                        </q-td>
                    </template>

                </q-table>

            </q-card-section>
        </div>

        <q-separator inset />

        <q-card-section>

            <!-- Personas table -->
            <q-table dense wrap-cells :rows-per-page-options="[0]" :rowsPerPage="0" class="my-sticky-header-table"
                :columns="columns" :rows="personas" row-key="id" :filter="personasFilter" :title="t('personas.title')">

                <template v-slot:top-right>
                    <!-- File picker input (hidden). Put here to avoid being created for each table row. -->
                    <q-file ref="avatarPicker" v-model="avatarImage" @update:model-value="handleAvatarSelected()"
                        accept=".png, .jpg, .jpeg, .svg" style="display:none" />

                    <!-- Search input for table content -->
                    <q-input filled dense debounce="300" v-model="personasFilter"
                        :label="t('personas.actions.search.placeholder')">
                        <template v-slot:append>
                            <q-icon name="search" />
                        </template>
                    </q-input>
                </template>

                <template v-slot:body-cell-avatar="props">
                    <q-td :props="props">
                        <q-item-section avatar>
                            <q-avatar size="xl" @click="handleAvatarPicker(props.row.id)">
                                <img v-if="'avatar' in props.row" :src="props.row.avatar" />
                                <q-icon v-else name="mdi-account" />
                                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                                    {{ t('personas.actions.avatar.tooltip') + props.row.id }}
                                </q-tooltip>
                            </q-avatar>
                        </q-item-section>
                    </q-td>
                </template>

                <template v-slot:body-cell-name="props">
                    <q-td :props="props">
                        <div v-if="!props.row.readonly">
                            <q-input borderless filled dense autogrow style="width: 100%;" input-style="{ cursor: 'text' }"
                                focus v-model="props.row.name" />
                        </div>
                        <div v-else>
                            {{ props.row.name }}
                        </div>
                    </q-td>
                </template>

                <template v-slot:body-cell-prompt="props">
                    <q-td :props="props">

                        <div v-if="!props.row.readonly">
                            <div class="row">
                                <div class="col">
                                    <q-input borderless filled dense autogrow style="width: 100%;"
                                        input-style="{ cursor: 'text' }" focus v-model="props.row.prompt">

                                        <template v-slot:append>
                                            <q-btn size="sm" flat dense color="primary" icon="mdi-content-save-outline"
                                                :disabled="props.row.id == 0" @click="savePersona(props.row)">
                                                <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                                    {{ props.row.readonly ? $t('personas.actions.edit.tooltip') :
                                                        $t('personas.actions.save.tooltip')
                                                    }}
                                                </q-tooltip>
                                            </q-btn>
                                        </template>
                                    </q-input>
                                </div>
                                <div class="col-auto">
                                    <q-btn size="sm" dense flat icon="mdi-delete-outline" :color="iconColor"
                                        :disabled="props.row.id == 0" @click="deletePersona(props.row)">
                                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                            {{ $t('personas.actions.delete.tooltip') }}
                                        </q-tooltip>
                                    </q-btn>
                                </div>
                            </div>
                        </div>
                        <div v-else>
                            <div class="row">
                                <div class="col">{{ props.row.prompt }}</div>
                                <div class="col-auto">
                                    <q-btn size="sm" dense flat icon="mdi-pencil-outline" :color="iconColor"
                                        :disabled="props.row.id == 0" @click="props.row.readonly = false">
                                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                            {{ $t('personas.actions.add.tooltip') }}
                                        </q-tooltip>
                                    </q-btn>
                                    <q-btn size="sm" dense flat icon="mdi-delete-outline" :color="iconColor"
                                        :disabled="props.row.id == 0" @click="deletePersona(props.row)">
                                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                            {{ $t('personas.actions.delete.tooltip') }}
                                        </q-tooltip>
                                    </q-btn>
                                </div>
                            </div>
                        </div>
                    </q-td>
                </template>

            </q-table>
        </q-card-section>
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

        const columns = [
            { name: 'avatar', align: 'left', label: t('personas.tableHeading.avatar'), field: 'avatar', sortable: false, style: 'width: 50px' },
            { name: 'name', align: 'left', label: t('personas.tableHeading.name'), field: 'name', sortable: true, style: 'width: 150px' },
            { name: 'prompt', align: 'left', label: t('personas.tableHeading.prompt'), field: 'prompt', sortable: true }
        ];

        const fetchAwesomePrompts = () => {
            fetch("https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv")
                .then(response => response.text())
                .then(data => {
                    awesomePrompts.value = data.toString()
                        .trim()
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

        const newPersona = ref({
            name: t('personas.actions.create.name'),
            prompt: t('personas.actions.create.prompt'),
            expanded: false
        });

        // Avatar related
        const avatarPicker = ref(null);
        const avatarImage = ref(null);
        let selectedPersonaId = '';
        const handleAvatarPicker = (personaId) => {
            selectedPersonaId = personaId;
            avatarPicker.value.pickFiles();
        }

        // Converts image from the avatar picker dialog to base64 and stores it as user avatar
        const handleAvatarSelected = () => {
            if (avatarImage.value) {
                const reader = new FileReader();
                reader.onload = () => {
                    // Set avatar for selected persona in personas array
                    personas.value = personas.value.map(item => {
                        if (item.id == selectedPersonaId) {
                            item.avatar = reader.result;
                        }
                        return item;
                    });
                    // Reset values
                    selectedPersonaId = '';
                    avatarImage.value = null;
                }
                reader.readAsDataURL(avatarImage.value);
            }
        }

        return {
            t,
            personas,
            awesomePrompts,

            columns,
            awesomePromptsfilter: ref(''),
            personasFilter: ref(''),

            addAwesomePrompt,
            newPersona,
            saveNewPersona: () => {
                personas.value.push({
                    id: Date.now().toString(),
                    name: newPersona.value.name,
                    prompt: newPersona.value.prompt,
                    readonly: true
                });
                newPersona.value.name = t('personas.actions.create.name'),
                    newPersona.value.prompt = t('personas.actions.create.prompt'),
                    newPersona.value.expanded = false;
            },
            savePersona: (persona) => persona.readonly = !persona.readonly,
            deleteAwesomePrompts: () => awesomePrompts.value = [],
            deletePersona: (persona) => personas.value = personas.value.filter(item => item.id != persona.id),
            fetchAwesomePrompts,

            handleAvatarPicker,
            handleAvatarSelected,
            avatarPicker,
            avatarImage,

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style>
.my-sticky-header-table {
    /* height or max-height is important */
    height: calc(50vh);
}

.my-sticky-header-table .q-table__top,
.my-sticky-header-table .q-table__bottom,
.my-sticky-header-table thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: #181919;
    background-color: #c5c5c5;
}

.my-sticky-header-table thead tr th {
    position: sticky;
    z-index: 1;
    text-transform: uppercase;
}

.q-table--dark .q-table__top,
.q-table--dark .q-table__bottom,
.q-table--dark thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: #181919;
}

.my-sticky-header-table thead tr:first-child th {
    top: 0;
}

.my-sticky-header-table.q-table--loading thead tr:last-child th {
    /* height of all previous header rows */
    top: 48px;
}

.my-sticky-header-table tbody {
    /* height of all previous header rows */
    scroll-margin-top: 48px;
}
</style>
