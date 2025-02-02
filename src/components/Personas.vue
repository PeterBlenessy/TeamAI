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
                        :expand-icon="mdiAccountPlusOutline" :expanded-icon="mdiAccountPlusOutline"
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
                                            :icon="mdiContentSaveOutline" @click="saveNewPersona">

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
                            @click="awesomePrompts.length == 0 ? fetchAwesomePrompts('AwesomeChatGPTPrompts') : deleteAwesomePrompts()"
                            :icon="awesomePrompts.length == 0 ? mdiAccountArrowDownOutline : mdiAccountCancelOutline">

                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ awesomePrompts.length == 0 ? t('personas.actions.import.tooltip') :
                                    t('personas.actions.delete.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                    </q-item-section>
                </q-item>
                <q-item>
                    <q-item-section>
                        <q-item-label caption>{{ t('personas.actions.example.caption') }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-btn dense flat :color="awesomePrompts.length == 0 ? iconColor : 'primary'"
                            @click="awesomePrompts.length == 0 ? fetchAwesomePrompts('ExamplePersonas') : deleteAwesomePrompts()"
                            :icon="awesomePrompts.length == 0 ? mdiAccountArrowDownOutline : mdiAccountCancelOutline">

                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ awesomePrompts.length == 0 ? t('personas.actions.example.tooltip') :
                                    t('personas.actions.delete.tooltip') }}
                            </q-tooltip>
                        </q-btn>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card-section>

        <!-- Show the table if there is something to show -->
        <div v-if="validAwesomePrompts.length > 0">

            <q-separator inset />

            <q-card-section>

                <q-table dense wrap-cells :rows-per-page-options="[0]" :rowsPerPage="0" class="my-sticky-header-table"
                    :columns="columns" :rows="validAwesomePrompts" row-key="id" :filter="awesomePromptsfilter"
                    title="Awesome ChatGPT prompts">

                    <template v-slot:top-right>
                        <q-input filled dense debounce="300" v-model="awesomePromptsfilter"
                            :placeholder="t('personas.actions.search.placeholder')">
                            <template v-slot:append>
                                <q-icon :name="mdiMagnify" />
                            </template>
                        </q-input>
                    </template>

                    <template v-slot:body-cell-prompt="props">
                        <q-td :props="props">
                            <div class="row">
                                <div class="col">{{ props.row.prompt }}</div>
                                <div class="col-auto">
                                    <q-btn size="sm" dense flat :icon="mdiAccountPlusOutline" :color="iconColor"
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
                :columns="columns" :rows="validPersonas" row-key="id" :filter="personasFilter" :title="t('personas.title')">

                <template v-slot:top-right>
                    <!-- File picker input (hidden). Put here to avoid being created for each table row. -->
                    <q-file ref="avatarPicker" v-model="avatarImage" @update:model-value="handleAvatarSelected()"
                        accept=".png, .jpg, .jpeg, .svg" style="display:none" />

                    <!-- Search input for table content -->
                    <q-input filled dense debounce="300" v-model="personasFilter"
                        :label="t('personas.actions.search.placeholder')">
                        <template v-slot:append>
                            <q-icon :name="mdiMagnify" />
                        </template>
                    </q-input>
                </template>

                <template v-slot:body-cell-avatar="props">
                    <q-td :props="props">
                        <q-item-section avatar>
                            <q-avatar size="xl" @click="handleAvatarPicker(props.row.id)">
                                <img v-if="'avatar' in props.row" :src="props.row.avatar" />
                                <q-icon v-else :name="mdiAccount" />
                                <q-tooltip :delay="1000" max-width="300px" transition-show="scale" transition-hide="scale">
                                    {{ t('personas.actions.avatar.tooltip') }}
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
                                            <q-btn size="sm" flat dense color="primary" :icon="mdiContentSaveOutline"
                                                :disabled="props.row.id === 'default'" @click="savePersona(props.row)">
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
                                    <q-btn size="sm" dense flat :icon="mdiDeleteOutline" :color="iconColor"
                                        :disabled="props.row.id === 'default'" @click="deletePersona(props.row)">
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
                                    <q-btn size="sm" dense flat :icon="mdiPencilOutline" :color="iconColor"
                                        :disabled="props.row.id === 'default'" @click="savePersona(props.row)">
                                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                            {{ $t('personas.actions.add.tooltip') }}
                                        </q-tooltip>
                                    </q-btn>
                                    <q-btn size="sm" dense flat :icon="mdiDeleteOutline" :color="iconColor"
                                        :disabled="props.row.id === 'default'" @click="deletePersona(props.row)">
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

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHelpers } from '@/composables/useHelpers';
import { storeToRefs } from 'pinia';
import { useTeamsStore } from '@/stores/teams-store.js';
import logger from '@/services/logger.js';
import { 
    mdiAccount,
    mdiAccountPlusOutline,
    mdiAccountArrowDownOutline,
    mdiAccountCancelOutline,
    mdiContentSaveOutline,
    mdiDeleteOutline,
    mdiPencilOutline,
    mdiMagnify
} from '@quasar/extras/mdi-v7';

const { t } = useI18n();

const { iconColor } = useHelpers();

const teamsStore = useTeamsStore();
const { personas } = storeToRefs(teamsStore);
const awesomePrompts = ref([]);

// Add validation for table data
const validateTableData = (data) => {
    return data && typeof data === 'object' && 'name' in data && 'prompt' in data;
};

// Ensure personas array is initialized and valid
const validPersonas = computed(() => {
    if (!Array.isArray(personas.value)) {
        logger.error('[Personas] Personas is not an array');
        return [];
    }
    return personas.value.filter(validateTableData);
});

// Ensure awesome prompts are valid
const validAwesomePrompts = computed(() => {
    return awesomePrompts.value.filter(validateTableData);
});

// Update table configurations to use computed properties
const columns = [
    { 
        name: 'avatar', 
        align: 'left', 
        label: t('personas.tableHeading.avatar'), 
        field: row => row.avatar || null,
        sortable: false, 
        style: 'width: 50px' 
    },
    { 
        name: 'name', 
        align: 'left', 
        label: t('personas.tableHeading.name'), 
        field: row => row.name || '',
        sortable: true, 
        style: 'width: 150px' 
    },
    { 
        name: 'prompt', 
        align: 'left', 
        label: t('personas.tableHeading.prompt'), 
        field: row => row.prompt || '',
        sortable: true 
    }
];

// Update template refs and handlers
const avatarPicker = ref(null);
const avatarImage = ref(null);
const awesomePromptsfilter = ref('');
const personasFilter = ref('');
let selectedPersonaId = '';

const newPersona = ref({
    name: t('personas.actions.create.name'),
    prompt: t('personas.actions.create.prompt'),
    expanded: false
});

const fetchAwesomePrompts = (source = "AwesomeChatGPTPrompts") => {
    const awesomeSources = {
        "AwesomeChatGPTPrompts": "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv",
        "ExamplePersonas": "https://raw.githubusercontent.com//PeterBlenessy/team-ai-examples/main/personas.json",
    }
    
    awesomePrompts.value = []
    
    const handleError = (error, context) => {
        const errorStr = String(error || `Unknown error fetching ${context}`)
        logger.error(`[Personas] - ${errorStr}`)
        awesomePrompts.value = []
    }
    
    const normalizePromptData = (data, index) => {
        return teamsStore.normalizePersona({
            id: `${Date.now()}-${index}`,
            name: data.name || `Prompt ${index + 1}`,
            prompt: data.prompt || data.content || data.description || 'No prompt provided',
            readonly: true,
            lastModified: Date.now()
        });
    };

    if (source === "AwesomeChatGPTPrompts") {
        fetch(awesomeSources[source])
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                return response.text()
            })
            .then(data => {
                const parsed = data.toString()
                    .trim()
                    .split("\n")
                    .map((row, index) => {
                        try {
                            const [name, prompt] = row.split('","').map(item => 
                                item.trim().replace(/^"|"$/g, ''));
                            return normalizePromptData({ name, prompt }, index);
                        } catch (e) {
                            logger.warn(`[Personas] Skipping malformed row: ${row}`);
                            return null;
                        }
                    })
                    .filter(Boolean);
                
                if (parsed.length > 0) {
                    awesomePrompts.value = parsed.slice(1);
                    logger.info(`[Personas] Successfully loaded ${awesomePrompts.value.length} prompts`);
                }
            })
            .catch(error => handleError(error, 'prompts'))
    } else if (source === "ExamplePersonas") {
        fetch(awesomeSources[source])
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                return response.json()
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error('Invalid data format')
                }
                
                awesomePrompts.value = data.map((item, index) => 
                    normalizePromptData(item, index)
                );
                logger.info(`[Personas] Successfully loaded ${awesomePrompts.value.length} example personas`);
            })
            .catch(error => handleError(error, 'examples'))
    }
}

const addAwesomePrompt = (persona) => {
    try {
        // Normalize data before adding
        const normalizedPersona = teamsStore.normalizePersona(persona);
        
        // Remove from awesome prompts
        awesomePrompts.value = awesomePrompts.value.filter(item => item.id != persona.id);
        
        // Add to personas
        personas.value.push(normalizedPersona);
        
        logger.info(`[Personas] Successfully added persona: ${normalizedPersona.name}`);
    } catch (error) {
        logger.error(`[Personas] Error adding persona:`, { error, persona });
    }
};

const handleAvatarPicker = (personaId) => {
    selectedPersonaId = personaId;
    avatarPicker.value.pickFiles();
};

const handleAvatarSelected = () => {
    if (avatarImage.value) {
        const reader = new FileReader();
        reader.onload = () => {
            personas.value = personas.value.map(item => {
                if (item.id == selectedPersonaId) {
                    item.avatar = reader.result;
                    item.lastModified = Date.now();
                }
                return item;
            });
            selectedPersonaId = '';
            avatarImage.value = null;
        }
        reader.readAsDataURL(avatarImage.value);
    }
};

const saveNewPersona = () => {
    personas.value.push({
        id: Date.now().toString(),
        name: newPersona.value.name,
        prompt: newPersona.value.prompt,
        readonly: true,
        lastModified: Date.now()
    });
    newPersona.value.name = t('personas.actions.create.name');
    newPersona.value.prompt = t('personas.actions.create.prompt');
    newPersona.value.expanded = false;
};

const savePersona = (persona) => {
    try {
        if (!persona || !persona.id) {
            logger.error('[Personas] Cannot save persona: Invalid persona data', persona);
            return;
        }

        const index = personas.value.findIndex(p => p.id === persona.id);
        if (index === -1) {
            logger.error('[Personas] Cannot save persona: Persona not found', persona.id);
            return;
        }

        // Create new persona object to trigger reactivity
        personas.value[index] = {
            ...persona,
            readonly: !persona.readonly,
            lastModified: Date.now()
        };
        
        logger.info(`[Personas] Successfully saved persona: ${persona.name}`);
    } catch (error) {
        const errorStr = String(error || 'Unknown error');
        logger.error('[Personas] Error saving persona:', {
            error: errorStr,
            persona: persona?.id,
            stack: error?.stack
        });
    }
};

const deleteAwesomePrompts = () => awesomePrompts.value = [];

const deletePersona = (persona) => {
    try {
        if (!persona || !persona.id) {
            logger.error('[Personas] Cannot delete persona: Invalid persona data', persona);
            return;
        }

        // Check if persona exists before deleting
        const personaExists = personas.value.some(p => p.id === persona.id);
        if (!personaExists) {
            logger.error('[Personas] Cannot delete persona: Persona not found', persona.id);
            return;
        }

        logger.debug('[Personas] Deleting persona:', {
            id: persona.id,
            name: persona.name
        });

        personas.value = personas.value.filter(item => item.id !== persona.id);
        logger.info(`[Personas] Successfully deleted persona: ${persona.name}`);
    } catch (error) {
        const errorStr = String(error || 'Unknown error');
        logger.error('[Personas] Error deleting persona:', {
            error: errorStr,
            persona: persona?.id,
            stack: error?.stack
        });
    }
};
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
