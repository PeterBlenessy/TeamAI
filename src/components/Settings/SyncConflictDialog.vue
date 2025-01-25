<template>
  <q-dialog ref="dialogRef">
    <q-card class="sync-conflict-dialog">
      <q-card-section>
        <div class="text-h6">{{ $t('icloud.sync.conflict.title') }}</div>
        <div class="text-subtitle2">{{ $t('icloud.sync.conflict.subtitle') }}</div>
      </q-card-section>

      <q-card-section class="conflict-list q-pa-none">
        <q-list separator>
          <q-item v-for="conflict in props.conflicts" :key="conflict.key">
            <q-item-section>
              <q-item-label>{{ formatConflictKey(conflict.key) }}</q-item-label>
              <q-item-label caption>
                {{ $t('icloud.sync.conflict.choose') }}
              </q-item-label>
              
              <div class="row q-gutter-md q-mt-sm">
                <!-- Local Version -->
                <q-card flat bordered class="col conflict-version">
                  <q-card-section>
                    <div class="text-subtitle2">{{ $t('icloud.sync.conflict.local') }}</div>
                    <pre class="conflict-content">{{ formatContent(conflict.local) }}</pre>
                  </q-card-section>
                  <q-card-actions align="right">
                    <q-btn 
                      :label="$t('icloud.sync.conflict.useLocal')"
                      color="primary"
                      flat
                      :disable="conflict.choice === 'local'"
                      @click="selectVersion(conflict.key, 'local')"
                    />
                  </q-card-actions>
                </q-card>

                <!-- Remote Version -->
                <q-card flat bordered class="col conflict-version">
                  <q-card-section>
                    <div class="text-subtitle2">{{ $t('icloud.sync.conflict.remote') }}</div>
                    <pre class="conflict-content">{{ formatContent(conflict.remote) }}</pre>
                  </q-card-section>
                  <q-card-actions align="right">
                    <q-btn 
                      :label="$t('icloud.sync.conflict.useRemote')"
                      color="primary"
                      flat
                      :disable="conflict.choice === 'remote'"
                      @click="selectVersion(conflict.key, 'remote')"
                    />
                  </q-card-actions>
                </q-card>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          :label="$t('common.cancel')"
          color="primary"
          flat
          v-close-popup
        />
        <q-btn
          :label="$t('common.apply')"
          color="primary"
          :disable="!allConflictsResolved"
          @click="onApply"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';

const props = defineProps({
  conflicts: {
    type: Array,
    required: true
  }
});

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// Track conflict resolutions
const resolutions = ref(new Map());

// Format conflict key for display
const formatConflictKey = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/^./, str => str.toUpperCase());
};

// Format content for display
const formatContent = (content) => {
  if (typeof content === 'object') {
    return JSON.stringify(content, null, 2);
  }
  return String(content);
};

// Check if all conflicts are resolved
const allConflictsResolved = computed(() => {
  return props.conflicts.every(conflict => resolutions.value.has(conflict.key));
});

// Select version for a conflict
const selectVersion = (key, choice) => {
  resolutions.value.set(key, choice);
};

// Apply resolutions
const onApply = () => {
  const resolvedConflicts = props.conflicts.map(conflict => ({
    key: conflict.key,
    choice: resolutions.value.get(conflict.key)
  }));
  onDialogOK(resolvedConflicts);
};
</script>

<style lang="scss">
.sync-conflict-dialog {
  min-width: 600px;
  max-width: 900px;

  .conflict-version {
    min-width: 250px;
  }

  .conflict-content {
    max-height: 200px;
    overflow-y: auto;
    background: #f5f5f5;
    padding: 8px;
    border-radius: 4px;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 12px;
  }
}
</style>
