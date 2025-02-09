# Cloud Sync Refactor Plan

## Overview
Simplify the cloud sync implementation using composition to support multiple storage providers. The sync process synchronizes data between IndexedDB and local cloud storage folders (iCloud Drive, OneDrive, etc).

## File Structure
```
src/
  services/
    cloud-storage/
      create-provider.js    # Provider factory & validation
      base-operations.js    # Common file operations
      icloud/
        index.js           # iCloud implementation
      onedrive/            # Future provider
        index.js
  composables/
    useCloudSync.js        # Main composable hook
    cloud-sync/
      create-sync.js       # Core sync logic factory
      handlers/            # Type-specific handlers
```

## Implementation Steps

### 1. Storage Provider Factory
**Location**: src/services/cloud-storage/create-provider.js

1.1. Create provider factory
```javascript
// Provider interface example
const requiredMethods = {
  init: async () => {},
  readFile: async (path) => {},
  writeFile: async (path, data) => {},
  deleteFile: async (path) => {},
  listFiles: async (dirPath) => {},
  createDir: async (path) => {},
  listChanges: async (since) => {},
  isAvailable: () => {},
  getMetadata: async (path) => {}
};

// Factory function
function createProvider(implementation) {
  // Validate implementation has all required methods
  return {
    ...baseOperations,
    ...implementation
  };
}
```

1.2. Base operations
```javascript
// Location: src/services/cloud-storage/base-operations.js
const baseOperations = {
  async ensureDir(path) {
    const exists = await this.listFiles(path).catch(() => false);
    if (!exists) await this.createDir(path);
  },
  
  async safeWrite(path, data) {
    await this.ensureDir(dirname(path));
    await this.writeFile(path, data);
  }
};
```

1.3. Common types (as JSDoc)
```javascript
/**
 * @typedef {Object} FileMetadata
 * @property {Date} modified
 * @property {number} size
 * @property {'file'|'directory'} type
 */

/**
 * @typedef {Object} Change
 * @property {string} path
 * @property {'added'|'modified'|'deleted'} type
 * @property {Date} timestamp
 */
```

### 2. iCloud Implementation
**Location**: src/services/cloud-storage/icloud/index.js

2.1. Core implementation
```javascript
function createICloudStorage() {
  return createProvider({
    async init() {
      // Platform detection & setup
    },
    // Method implementations
  });
}
```

2.2. File operations
- Improved error handling
- Metadata tracking
- Directory operations

2.3. Testing utilities
- Mock provider factory
- Error simulation helpers

### 3. Sync Core Factory
**Location**: src/composables/cloud-sync/create-sync.js

3.1. Progress tracking
```javascript
function createProgress() {
  return {
    phase: ref('idle'), // check|upload|download
    phaseProgress: ref(0),
    totalProgress: ref(0),
    currentItem: ref(null),
    // Format: { type, id, count, total }
  };
}
```

3.2. Core operations
```javascript
function createSync(provider) {
  const progress = createProgress();
  
  return {
    // Public methods
    async sync() {
      const phases = [
        checkChanges,
        uploadChanges,
        downloadChanges
      ];
      
      for (const [i, phase] of phases.entries()) {
        progress.phase.value = phaseNames[i];
        await phase();
        progress.phaseProgress.value = 1;
        progress.totalProgress.value = (i + 1) / phases.length;
      }
    },
    
    // Progress tracking
    progress,
    
    // Error handling
    errors: ref([])
  };
}
```

3.3. Error handling
- Retry utilities
- Error collection
- Recovery helpers

### 4. Type Handlers
**Location**: src/composables/cloud-sync/handlers/

4.1. Handler factory
```javascript
function createHandler(options) {
  return {
    async transform(data) {
      // Transform for storage
    },
    async validate(data) {
      // Validate structure
    },
    getChanges(localData, remoteData) {
      // Detect changes
    }
  };
}
```

4.2. Type-specific implementations
```javascript
// conversations.js
export const conversationsHandler = createHandler({
  type: 'conversations',
  // Implementation
});
```

### 5. Main Hook
**Location**: src/composables/useCloudSync.js

5.1. Provider management
```javascript
const providers = {
  icloud: createICloudStorage,
  onedrive: createOneDriveStorage
};

export function useCloudSync(type = 'icloud') {
  const provider = providers[type]();
  const sync = createSync(provider);
  
  // Compose functionality
  return {
    syncToCloud: sync.sync,
    progress: sync.progress,
    errors: sync.errors
  };
}
```

### 6. UI Component
**Location**: src/components/CloudSyncStatus.vue

6.1. Simplified Progress Display
```vue
<template>
  <q-card v-if="shouldShow" class="cloud-sync-status">
    <q-card-section class="q-pa-sm">
      <!-- Overall sync progress -->
      <div class="text-caption">{{ progress.phase }} {{ progress.totalProgress * 100 }}%</div>
      <q-linear-progress 
        :value="progress.totalProgress" 
        class="q-mb-sm"
      />

      <!-- Current item progress (if any) -->
      <template v-if="progress.currentItem">
        <div class="text-caption">
          {{ progress.currentItem.type }} 
          {{ progress.currentItem.count }}/{{ progress.currentItem.total }}
        </div>
        <q-linear-progress 
          :value="progress.phaseProgress" 
          size="xs"
        />
      </template>
    </q-card-section>
  </q-card>
</template>
```

6.2. Component Logic
```javascript
// Simple props from useCloudSync
const { progress } = useCloudSync();

// Minimal computed state
const shouldShow = computed(() => progress.phase !== 'idle');
```

6.3. Styling
```css
.cloud-sync-status {
  position: fixed;
  bottom: 16px;
  right: 16px;
  min-width: 250px;
  z-index: 2000;
}
```

Key Improvements:
- No animations or spinning icons
- Clear progress indicators
- Progress bars show both overall and current item progress
- Minimal state management
- Simple, informative UI

## Migration Plan
1. Set up new file structure
2. Create provider factory and base operations
3. Port iCloud implementation to new structure
4. Create sync core with progress tracking
5. Add handlers one by one
6. Update UI component
7. Remove old implementation

## Testing Strategy
1. Unit tests with mock providers
2. Integration tests for full sync flow
3. Error simulation and recovery tests

## Future Extensions
1. Additional providers (OneDrive, Dropbox)
2. Conflict resolution
3. Auto sync scheduling
4. Bandwidth optimization

## Step-by-Step Migration Plan

### Phase 1: Foundation Setup (Week 1) ✅
1. Create new directory structure ✅
   - Set up services/cloud-storage/
   - Set up composables/cloud-sync/
   - Create placeholder files for core components

2. Provider Factory Implementation ✅
   - Implement create-provider.js with interface validation
   - Create base-operations.js with common utilities
   - Add TypeScript definitions for provider interfaces

3. Core Progress Tracking ✅
   - Implement createProgress in create-sync.js
   - Set up reactive state management
   - Add progress phase definitions

### Phase 2: Provider Migration (Week 2)
4. Port iCloud Provider
   - Move existing iCloud logic to new structure
   - Implement provider interface methods
   - Add improved error handling
   - Add retry mechanisms
   - Add metadata tracking

5. Add Provider Testing
   - Create mock provider factory
   - Add unit tests for provider operations
   - Add error simulation tests

### Phase 3: Core Sync Logic (Week 2-3)
6. Implement Sync Factory
   - Create core sync phases (check, upload, download)
   - Add progress tracking integration
   - Implement error collection and handling
   - Add recovery mechanisms

7. Create Handler System
   - Implement handler factory with validation
   - Add transform/validate base operations
   - Create change detection utilities

### Phase 4: Data Type Migration (Week 3)
8. Migrate Conversations Handler
   - Port existing validation logic
   - Add new transform operations
   - Implement change detection
   - Add unit tests

9. Migrate Personas Handler
   - Port existing validation logic
   - Add new transform operations
   - Implement change detection
   - Add unit tests

10. Migrate Images Handler
    - Port existing validation logic
    - Add binary data handling improvements
    - Implement change detection
    - Add unit tests

### Phase 5: UI Updates (Week 4)
11. Create New UI Components
    - Implement simplified progress display
    - Add error reporting component
    - Create settings interface updates

12. Update Store Integration
    - Update settings store
    - Add new sync state management
    - Implement improved error handling

### Phase 6: Testing & Cleanup (Week 4-5)
13. Integration Testing
    - Add end-to-end sync tests
    - Test error recovery scenarios
    - Add conflict resolution tests

14. Performance Testing
    - Add sync performance benchmarks
    - Optimize change detection
    - Add progress reporting optimizations

15. Documentation & Cleanup
    - Update API documentation
    - Add usage examples
    - Remove old implementation
    - Clean up deprecated code

### Rollout Strategy

#### Stage 1: Development (Week 1-4)
- Implement new system alongside existing code
- Run parallel testing with both implementations
- Collect metrics on performance and reliability

#### Stage 2: Beta Testing (Week 5)
- Enable new system for beta testers
- Monitor error rates and performance
- Collect user feedback
- Fix issues and optimize based on feedback

#### Stage 3: Production Rollout (Week 6)
- Gradual rollout to all users
- Monitor system metrics
- Keep old system as fallback
- Remove old implementation after stability period

### Success Metrics
- Reduced code complexity (measured by cyclomatic complexity)
- Improved test coverage (target: 90%+)
- Reduced error rates in sync operations
- Improved sync performance
- Positive user feedback on sync reliability

### Rollback Plan
- Keep old implementation in separate branch
- Maintain compatibility layer during transition
- Document state migration procedures
- Prepare rollback scripts and procedures

## Risk Assessment

### Technical Risks
1. Data loss during migration
   - Mitigation: Dual write during transition
   - Validation of all migrated data
   - Backup procedures before migration

2. Performance regression
   - Mitigation: Performance benchmarking
   - Gradual rollout
   - Monitoring and alerting

3. Integration issues
   - Mitigation: Comprehensive integration tests
   - Beta testing phase
   - Fallback mechanisms

### Operational Risks
1. User disruption
   - Mitigation: Clear user communication
   - Gradual rollout
   - Easy rollback process

2. Support impact
   - Mitigation: Updated documentation
   - Support team training
   - Monitoring and logging improvements

### Timeline Risks
1. Scope creep
   - Mitigation: Clear phase definitions
   - Regular progress reviews
   - Prioritized feature list

2. Resource constraints
   - Mitigation: Modular implementation
   - Clear task dependencies
   - Flexible resource allocation

## Git Strategy

### Branch Structure
```
main
└── feature/cloud-sync-refactor
```

### Development Workflow
1. Create feature branch
   ```bash
   git checkout -b feature/cloud-sync-refactor
   ```

2. Regular commits with clear, atomic changes following conventional commit messages
   ```
   feat(cloud-sync): implement provider factory
   feat(cloud-sync): port iCloud provider to new structure
   feat(cloud-sync): add base handler implementation
   feat(cloud-sync): migrate conversation handler
   feat(cloud-sync): migrate persona handler
   feat(cloud-sync): migrate image handler
   feat(cloud-sync): update UI components
   test(cloud-sync): add provider tests
   test(cloud-sync): add handler tests
   test(cloud-sync): add integration tests
   docs(cloud-sync): update API documentation
   ```

3. Code Review Process
   - Regular code reviews during development
   - Team reviews changes in smaller, digestible chunks
   - Address feedback promptly
   - Keep commit history clean and meaningful

### Pull Request Strategy

1. Create Draft PR Early
   - Create PR from `feature/cloud-sync-refactor` to `main`
   - Mark as draft
   - Use PR description template
   - Link to refactor documentation
   - Update PR description as work progresses

2. PR Description Template
   ```markdown
   # Cloud Sync Refactor

   ## Changes
   - [ ] Provider Factory Implementation
   - [ ] iCloud Provider Port
   - [ ] Sync Handlers
   - [ ] UI Components
   - [ ] Tests & Documentation

   ## Testing Done
   - [ ] Unit Tests
   - [ ] Integration Tests
   - [ ] Performance Benchmarks
   - [ ] Beta Testing Results

   ## Migration Impact
   - Data Migration Required: Yes/No
   - Breaking Changes: None
   - Rollback Plan: In place

   ## Documentation
   - Technical Design: [Link]
   - API Documentation: [Link]
   - Migration Guide: [Link]
   ```

3. PR Review Requirements
   - All tests passing
   - Code coverage >= 90%
   - No breaking changes
   - Migration documentation complete
   - Performance benchmarks acceptable

4. Merge Requirements
   - 1 approving reviews
   - All discussions resolved
   - CI/CD pipeline passing
   - Beta testing completed
   - Documentation updated
