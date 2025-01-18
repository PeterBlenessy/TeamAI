<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { mdiDownload, mdiCancel, mdiFileDocumentOutline, mdiDelete, mdiReload } from '@quasar/extras/mdi-v7';
import { useOllama } from '@/composables/useOllama';
import logger from '@/services/logger';

const $q = useQuasar();
const {
    availableModels,
    deleteModel,
    downloadingModels,
    formatModelName,
    getBaseName, 
    getRunningModels,
    getAvailableModels,
    loadModel,
    modelDetails,
    downloadModel,
    resumeDownloads,
    cancelModelDownload,
} = useOllama();

const tableLoading = ref(false);
const newModelName = ref('');

const modelColumns = [
    { name: 'name', label: 'Model', field: row => formatModelName(row), align: 'left' },
    { name: 'architecture', label: 'Architecture', field: row => modelDetails.value[row]?.model_info["general.architecture"] || '-', align: 'left' },
    { name: 'size', label: 'Size', field: row => modelDetails.value[row]?.details?.parameter_size || '-', align: 'left' },
    { name: 'quantization', label: 'Quantization', field: row => modelDetails.value[row]?.details?.quantization_level || '-', align: 'left' },
    { name: 'modified', label: 'Modified', field: row => modelDetails.value[row]?.modified_at || '-', align: 'left' },
    { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
];

const showLicenseDialog = ref(false);
const selectedLicenseModelName = ref('');
const selectedLicenseData = computed(() => 
    selectedLicenseModelName.value ? modelDetails.value[selectedLicenseModelName.value] : null
);

function showLicenseInfo(modelName) {
    setOperationLoading(modelName, 'info', true);
    try {
        selectedLicenseModelName.value = modelName;
        showLicenseDialog.value = true;
    } finally {
        setOperationLoading(modelName, 'info', false);
    }
}

// Combine available and downloading models
const combinedModels = computed(() => {
    const availableModelObjects = availableModels.value.map(name => ({
        name,
        downloading: false,
        progress: 0
    }));
    
    const downloadingModelObjects = downloadingModels.value.map(model => ({
        name: model.name,
        downloading: true,
        progress: model.progress
    }));
    
    // Put downloading models first, then sort available models alphabetically
    return [
        ...downloadingModelObjects,
        ...availableModelObjects.sort((a, b) => a.name.localeCompare(b.name))
    ];
});

async function handleDownloadModel(modelName) {
    if (!modelName) return;

    // Check if model is already downloading (exact match)
    if (downloadingModels.value.some(m => m.name === modelName)) {
        $q.notify({
            type: 'warning',
            message: `Model ${formatModelName(modelName)} is already downloading`
        });
        return;
    }

    // Check if model already exists (exact match)
    if (availableModels.value.includes(modelName)) {
        $q.notify({
            type: 'warning',
            message: `Model ${formatModelName(modelName)} is already installed`
        });
        return;
    }

    try {
        newModelName.value = '';
        await downloadModel(modelName);
    } catch (error) {
        $q.notify({
            type: 'negative',
            message: `Failed to download model: ${error.message}`
        });
    }
}

onMounted(async () => {
    tableLoading.value = true;
    try {
        await getAvailableModels();
        await updateModelStatuses();
        await resumeDownloads();
        // Start polling every 60 seconds
        statusCheckInterval = setInterval(updateModelStatuses, 60000);
    } finally {
        tableLoading.value = false;
    }
});

onUnmounted(() => {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
});

// Add loading states for model operations
const modelOperations = ref({});

function isOperationLoading(modelName, operation) {
    return modelOperations.value[modelName]?.[operation] || false;
}

function setOperationLoading(modelName, operation, loading) {
    if (!modelOperations.value[modelName]) {
        modelOperations.value[modelName] = {};
    }
    modelOperations.value[modelName][operation] = loading;
}

// Rename modelStatus to modelLoaded and initialize as empty object
const modelLoaded = ref({});
let statusCheckInterval;

// Update the function to use getRunningModels from useOllama
async function updateModelStatuses() {
    try {
        const loadedModels = await getRunningModels();
        // Reset all models to false first
        modelLoaded.value = Object.fromEntries(
            availableModels.value.map(model => [model, false])
        );
        // Then set the loaded ones to true
        loadedModels.forEach(model => {
            if (modelLoaded.value.hasOwnProperty(model)) {
                modelLoaded.value[model] = true;
            }
        });
    } catch (error) {
        logger.error(`Failed to update model statuses: ${error}`);
    }
}

async function handleLoadModel(modelName) {
    setOperationLoading(modelName, 'load', true);
    try {
        await loadModel(modelName);
        await updateModelStatuses();  // Update all statuses at once
        $q.notify({
            type: 'positive',
            message: `Model ${formatModelName(modelName)} loaded successfully`
        });
    } catch (error) {
        $q.notify({
            type: 'negative',
            message: `Failed to load model: ${error.message}`
        });
    } finally {
        setOperationLoading(modelName, 'load', false);
    }
}

async function handleDeleteModel(modelName) {
    setOperationLoading(modelName, 'delete', true);
    try {
        $q.dialog({
            message: `Are you sure you want to delete ${formatModelName(modelName)}?`,
            color: 'primary',
            cancel: true,
            persistent: true
        }).onOk(async () => {
            await deleteModel(modelName);
            $q.notify({
                type: 'positive',
                message: `Model ${formatModelName(modelName)} deleted successfully`
            });
        });
    } catch (error) {
        if (error) { // Not cancelled
            $q.notify({
                type: 'negative',
                message: `Failed to delete model: ${error.message}`
            });
        }
    } finally {
        setOperationLoading(modelName, 'delete', false);
    }
}

async function handleCancelDownload(modelName) {
    try {
        $q.dialog({
            message: `Are you sure you want to cancel downloading ${formatModelName(modelName)}?`,
            color: 'primary',
            cancel: true,
            persistent: true
        }).onOk(async () => {
            await cancelModelDownload(modelName);
            $q.notify({
                type: 'info',
                message: `Download cancelled for ${formatModelName(modelName)}`
            });
        });
    } catch (error) {
        if (error) { // Not cancelled
            $q.notify({
                type: 'negative',
                message: `Failed to cancel download: ${error.message}`
            });
        }
    }
}

</script>

<template>
    <q-card flat bordered class="q-mt-md">
        <q-card-section>
            <div class="text-h6">Ollama Model Manager</div>
            <div class="row q-col-gutter-md items-center q-mt-md">
                <q-input
                    dense filled
                    class="col"
                    v-model="newModelName"
                    label="Download new model"
                    placeholder="Enter the name of the model to download"
                    @keyup.enter="handleDownloadModel(newModelName)"
                >
                    <template v-slot:append v-if="newModelName">
                        <q-btn
                            flat round size="sm" :icon="mdiDownload"
                            @click="handleDownloadModel(newModelName)"
                        />
                    </template>
                </q-input>
            </div>
        </q-card-section>
        <q-card-section>
            <q-table
                :rows="combinedModels"
                :columns="modelColumns"
                row-key="name"
                dense
                flat
                :loading="tableLoading"
                :rows-per-page-options="[0]"
            >
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="name">{{ formatModelName(props.row.name) }}</q-td>
                        <q-td key="architecture">
                            {{ modelDetails[props.row.name]?.model_info["general.architecture"] || '' }}
                        </q-td>
                        <q-td key="size">
                            {{ modelDetails[props.row.name]?.details?.parameter_size || '' }}
                        </q-td>
                        <q-td key="quantization">
                            {{ modelDetails[props.row.name]?.details?.quantization_level || '' }}
                        </q-td>
                        <q-td key="modified">
                            {{ modelDetails[props.row.name]?.modified_at ? 
                                new Date(modelDetails[props.row.name].modified_at).toLocaleString() : '' }}
                        </q-td>
                        <q-td key="actions" class="text-right">
                            <template v-if="props.row.downloading">
                                    <q-circular-progress
                                        show-value
                                        :value="props.row.progress"
                                        color="primary"
                                        size="md"
                                        :thickness="0.4"
                                    />
                                    <q-btn flat dense size="sm" :icon="mdiCancel" @click="handleCancelDownload(props.row.name)">
                                        <q-tooltip>Cancel download</q-tooltip>
                                    </q-btn>
                            </template>
                            <template v-else>
                                <q-btn v-if="modelDetails[props.row.name]"
                                    flat dense size="sm"
                                    :icon="mdiFileDocumentOutline"
                                    :loading="isOperationLoading(props.row.name, 'info')"
                                    @click="showLicenseInfo(props.row.name)"
                                >
                                    <q-tooltip>Show license info</q-tooltip>
                                </q-btn>
                                <q-btn
                                    flat dense size="sm"
                                    :icon="mdiDelete"
                                    :loading="isOperationLoading(props.row.name, 'delete')"
                                    @click="handleDeleteModel(props.row.name)"
                                >
                                    <q-tooltip>Delete model</q-tooltip>
                                </q-btn>
                                <q-btn
                                    flat dense size="sm"
                                    :icon="mdiReload"
                                    :color="modelLoaded[props.row.name] ? 'positive' : ''"
                                    :loading="isOperationLoading(props.row.name, 'load')"
                                    @click="handleLoadModel(props.row.name)"
                                >
                                    <q-tooltip>
                                        {{ modelLoaded[props.row.name] ? 'Model is loaded' : 'Model is not loaded' }}
                                    </q-tooltip>
                                </q-btn>
                            </template>
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </q-card-section>
    </q-card>

    <!-- Model Details Dialog -->
    <q-dialog v-model="showLicenseDialog">
        <q-card style="min-width: 600px; max-width: 90%;" class="q-pa-md">
            <q-card-section>
                <div class="text-h6">{{ formatModelName(selectedLicenseModelName) }}</div>
            </q-card-section>
            <q-separator />
            <q-card-section v-if="selectedLicenseData">
                <div class="text-subtitle2">License</div>
                <q-list dense>
                    <q-item>
                        <q-item-section>
                            <pre class="text-caption">{{ selectedLicenseData.license }}</pre>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat label="Close" color="primary" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>
