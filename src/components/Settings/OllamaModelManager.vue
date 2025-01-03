<template>
    <q-card flat bordered class="q-mt-md">
        <q-card-section>
            <div class="text-h6">Ollama Model Manager</div>
            <div class="row q-col-gutter-md items-center q-mt-md">
                <q-input
                    dense filled
                    class="col"
                    v-model="newModelName"
                    @input="handleModelSearch"
                    label="Download new model"
                    placeholder="Enter the name of the model to download"
                    @keyup.enter="handleAddCustomModel"
                >
                    <template v-slot:append v-if="newModelName">
                        <q-circular-progress v-if="newModelLoading"
                            show-value
                            :value="pullProgress"
                            color="primary"
                            size="md"
                            :thickness="0.4"
                        />
                        <q-btn v-else
                            flat round size="sm" icon="mdi-download"
                            @click="handleAddCustomModel"
                        />
                    </template>
                </q-input>
            </div>
        </q-card-section>
        <q-card-section>
            <q-table
                :rows="availableModels"
                :columns="modelColumns"
                row-key="name"
                dense
                flat
                :loading="tableLoading"
                :rows-per-page-options="[0]"
            >
                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="name">{{ formatModelName(props.row) }}</q-td>
                        <q-td key="architecture">
                            {{ modelDetails[props.row]?.model_info["general.architecture"] || '-' }}
                        </q-td>
                        <q-td key="size">
                            {{ modelDetails[props.row]?.details?.parameter_size || '-' }}
                        </q-td>
                        <q-td key="quantization">
                            {{ modelDetails[props.row]?.details?.quantization_level || '-' }}
                        </q-td>
                        <q-td key="modified">
                            {{ modelDetails[props.row]?.modified_at ? 
                                new Date(modelDetails[props.row].modified_at).toLocaleString() : '-' }}
                        </q-td>
                        <q-td key="actions">
                            <q-btn v-if="modelDetails[props.row]"
                                flat dense size="sm"
                                icon="mdi-file-document-outline"
                                :loading="modelOperations[props.row]"
                                @click="showLicenseInfo(props.row)"
                            >
                                <q-tooltip>Show license info</q-tooltip>
                            </q-btn>
                            <q-btn
                                flat dense size="sm"
                                icon="mdi-delete"
                                :loading="modelOperations[props.row]"
                                @click="handleDeleteModel(props.row)"
                            >
                                <q-tooltip>Delete model</q-tooltip>
                            </q-btn>
                            <q-btn
                                flat dense size="sm"
                                icon="mdi-reload"
                                :color="runningModels[props.row] ? 'positive' : ''"
                                :loading="modelOperations[props.row]"
                                @click="handleLoadModel(props.row)"
                            >
                                <q-tooltip>
                                    {{ runningModels[props.row] ? 'Model is running' : 'Model is stopped' }}
                                </q-tooltip>
                            </q-btn>
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

<script>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useOllama } from '@/composables/useOllama';

export default {
    name: 'OllamaModelManager',
    setup() {
        const $q = useQuasar();
        const {
            availableModels,
            modelDownloading,
            pullProgress,
            modelDetails,
            runningModels,
            formatModelName,
            pullSpecificModel,
            deleteModel,
            loadModel,
            loadAvailableModels  // Add this
        } = useOllama();

        const tableLoading = ref(false);
        const newModelName = ref('');
        const newModelLoading = ref(false);
        
        const modelColumns = [
            { name: 'name', label: 'Model', field: row => formatModelName(row), align: 'left' },
            { name: 'architecture', label: 'Architecture', field: row => modelDetails.value[row]?.model_info["general.architecture"] || '-', align: 'left' },
            { name: 'size', label: 'Size', field: row => modelDetails.value[row]?.details?.parameter_size || '-', align: 'left' },
            { name: 'quantization', label: 'Quantization', field: row => modelDetails.value[row]?.details?.quantization_level || '-', align: 'left' },
            { name: 'modified', label: 'Modified', field: row => modelDetails.value[row]?.modified_at || '-', align: 'left' },
            { name: 'actions', label: 'Actions', field: 'actions', align: 'center' }
        ];

        const showLicenseDialog = ref(false);
        const selectedLicenseModelName = ref('');
        const selectedLicenseData = computed(() => 
            selectedLicenseModelName.value ? modelDetails.value[selectedLicenseModelName.value] : null
        );

        function showLicenseInfo(modelName) {
            selectedLicenseModelName.value = modelName;
            showLicenseDialog.value = true;
        }

        async function handleAddCustomModel() {
            if (!newModelName.value) return;
            newModelLoading.value = true;
            await pullSpecificModel(newModelName.value);
            newModelLoading.value = false;
            newModelName.value = '';
        }

        onMounted(async () => {
            tableLoading.value = true;
            try {
                await loadAvailableModels();
            } finally {
                tableLoading.value = false;
            }
        });

        // Add loading states for model operations
        const modelOperations = ref({});

        async function handleLoadModel(modelName) {
            modelOperations.value[modelName] = true;
            try {
                await loadModel(modelName);
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
                modelOperations.value[modelName] = false;
            }
        }

        async function handleDeleteModel(modelName) {
            try {
                await $q.dialog({
                    title: 'Confirm Deletion',
                    message: `Are you sure you want to delete ${formatModelName(modelName)}?`,
                    cancel: true,
                    persistent: true
                });

                modelOperations.value[modelName] = true;
                await deleteModel(modelName);
            } catch (error) {
                if (error) { // Not canceled
                    $q.notify({
                        type: 'negative',
                        message: `Failed to delete model: ${error.message}`
                    });
                }
            } finally {
                modelOperations.value[modelName] = false;
            }
        }

        // Debounce model search input
        let searchTimeout;
        function handleModelSearch(val) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                newModelName.value = val;
            }, 300);
        }

        return {
            availableModels,
            modelDownloading,
            pullProgress,
            modelDetails,
            runningModels,
            formatModelName,
            deleteModel,
            loadModel,
            
            tableLoading,
            modelColumns,
            
            newModelName,
            newModelLoading,
            handleAddCustomModel,
            
            showLicenseDialog,
            selectedLicenseModelName,
            selectedLicenseData,
            showLicenseInfo,
            modelOperations,
            handleLoadModel,
            handleDeleteModel,
            handleModelSearch
        };
    }
}
</script>
