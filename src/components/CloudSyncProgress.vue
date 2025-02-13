<template>
  <div class="cloud-sync-status" v-if="syncing">
    <!-- Progress Display -->
    <q-card v-if="showProgress && syncing" bordered flat class="bg-transparent">
      <q-linear-progress
        :value="itemProgress"
        :color="progressColor"
        :class="`bg-${progressColor}`"
        size="4px"
        class="q-mt-sm"
      />
      <div class="text-caption q-pa-xs text-center">
        {{ currentPhase }}
        <template v-if="progress.value?.current">
          ({{ progress.value.current.count }}/{{ progress.value.current.total }} {{ progress.value.current.type }})
        </template>
      </div>
    </q-card>
  </div>

  <!-- Conflict Resolution Dialog -->
  <q-dialog v-model="dialogVisible" persistent>
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ t('sync.conflicts.title') }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-radio
          v-model="selectedResolution"
          v-for="option in resolutionOptions"
          :key="option.value"
          :val="option.value"
          :label="option.label"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          :label="t('sync.conflicts.cancel')"
          color="primary"
          data-test="cancel-btn"
          @click="cancelConflict"
        />
        <q-btn
          :disable="!selectedResolution"
          flat
          :label="t('sync.conflicts.resolve')"
          color="primary"
          data-test="resolve-btn"
          @click="resolveConflict"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCloudSync } from '@/composables/useCloudSync';
import { SyncPhase } from '@/composables/cloudSync/sync-constants';

const emit = defineEmits(['resolveConflict', 'cancelConflict']);
const { t } = useI18n();
const { progress, syncing } = useCloudSync();

const showProgress = ref(true);
const currentConflict = ref(null);
const selectedResolution = ref(null);
const dialogVisible = ref(false);

// Computed properties for progress display
const currentPhase = computed(() => {
  switch (progress.value?.phase) {
    case SyncPhase.CHECKING: return t('cloud.sync.phase.checking');
    case SyncPhase.UPLOADING: return t('cloud.sync.phase.uploading');
    case SyncPhase.DOWNLOADING: return t('cloud.sync.phase.downloading');
    case SyncPhase.CLEANING: return t('cloud.sync.phase.cleaning');
    case SyncPhase.COMPLETED: return t('cloud.sync.phase.completed');
    case SyncPhase.ERROR: return t('cloud.sync.phase.failed');
    case SyncPhase.STARTING: return t('cloud.sync.phase.starting');
    default: return t('cloud.sync.phase.idle');
  }
});

const progressColor = computed(() => {
  switch (progress.value?.phase) {
    case SyncPhase.ERROR: return 'negative';
    case SyncPhase.COMPLETED: return 'positive';
    default: return 'primary';
  }
});

const itemProgress = computed(() => {
  if (!progress.value?.current) return 0;
  return progress.value.current.count / progress.value.current.total;
});

const conflictType = computed(() => {
  if (!currentConflict.value) return '';
  if (currentConflict.value.type === 'readonly') {
    return t('sync.conflicts.readonly');
  }
  return t('sync.conflicts.unknown');
});

const resolutionOptions = computed(() => {
  if (!currentConflict.value) return [];
  if (currentConflict.value.type === 'readonly') {
    return [
      {
        value: 'keep-remote',
        label: t('sync.conflicts.resolutions.keepRemote'),
        description: t('sync.conflicts.resolutions.keepRemoteDesc')
      },
      {
        value: 'force-upload',
        label: t('sync.conflicts.resolutions.forceUpload'),
        description: t('sync.conflicts.resolutions.forceUploadDesc')
      }
    ];
  }
  return [];
});

// Methods
const showConflict = async (conflict) => {
  currentConflict.value = conflict;
  selectedResolution.value = null;
  dialogVisible.value = true;
  await nextTick();
};

const resolveConflict = () => {
  if (!currentConflict.value || !selectedResolution.value) return;
  
  emit('resolveConflict', {
    type: currentConflict.value.type,
    resolution: selectedResolution.value,
    local: currentConflict.value.local,
    remote: currentConflict.value.remote
  });
  
  dialogVisible.value = false;
  currentConflict.value = null;
  selectedResolution.value = null;
};

const cancelConflict = () => {
  emit('cancelConflict', currentConflict.value);
  dialogVisible.value = false;
  currentConflict.value = null;
  selectedResolution.value = null;
};

defineExpose({
  showConflict
});
</script>

<style scoped>
.cloud-sync-status {
  position: fixed;
  bottom: 16px;
  right: 16px;
  min-width: 300px;
  max-width: 400px;
  z-index: 2000;
}

.resolution-option {
  border-radius: 4px;
  transition: background-color 0.2s;
}

.resolution-option:hover {
  background: rgba(0, 0, 0, 0.03);
}

.dark .resolution-option:hover {
  background: rgba(255, 255, 255, 0.03);
}
</style>