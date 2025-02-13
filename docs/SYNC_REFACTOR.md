# Cloud Sync Refactoring Plan

## Current State
Files to Remove:
✅ src/composables/cloud-sync/ (entire directory with middleware and complex handlers) - ✅ REMOVED
✅ src/services/cloud-storage/ (provider abstractions) - ✅ REMOVED
✅ src/services/icloud/ (old implementation) - ✅ REMOVED

Test Files to Remove:
✅ tests/cloud-sync.test.js (old monolithic test) - ✅ REMOVED
✅ tests/cloud-sync/* (old implementation tests) - ✅ REMOVED

## Target Architecture
```
src/
  components/
    CloudSync.vue           # Progress display and sync UI
  
  composables/
    useCloudSync.js              # Main sync logic and orchestration 
    cloudSync/
      conversations.js           # Conversation data format & sync
      images.js                  # Image data format & sync
      personas.js               # Persona data format & sync
  
  services/
    cloudSyncService.js         # Provider management & errors
    cloudSync/
      iCloudDrive.js           # iCloud file operations
```

## Separation of concerns

1. composables/cloudSync/*.js - Only data structures, validation, and parsing:
  - personas.js: Handles persona data format
  - conversations.js: Handles conversation data format
  - images.js: Handles image metadata format

2. useCloudSync.js - Orchestrates sync through cloudSyncService:
  - Gets sync options from settings
  - Calls cloudSyncService for file operations
  - Uses data handlers from composables for validation

3. services/cloudSyncService.js - Provider-agnostic interface:
  - Manages provider lifecycle
  - Exposes file operations
  - Validates data types

4. services/cloudSync/iCloudDrive.js - Provider implementation:
  - Handles all iCloud-specific operations
  - Manages binary vs text content
  - Handles path encoding

## Implementation Steps

### 1. Provider Layer ✅ DONE
✅ cloudSyncService.js - Basic error types and provider management
✅ iCloudDrive.js - Simple file operations for iCloud
✅ Test initialization on different platforms
✅ Test file operations (read/write/list/delete)
✅ Test error handling
✅ Test platform detection

### 2. Data Handlers ✅ DONE
✅ Created simplified handlers that:
- Know their data format
- Handle validation
- Import from IndexedDB 
- Export to files

✅ Implemented files:
- src/composables/cloudSync/conversations.js
- src/composables/cloudSync/images.js  
- src/composables/cloudSync/personas.js

✅ Tests added:
- Data validation
- Format conversion
- File handling

### 3. Main Sync Logic ✅ DONE
✅ Updated useCloudSync.js to:
- Use new provider layer
- Use simplified handlers
- Track sync progress
- Handle errors

### 4. UI Updates ✅ DONE
✅ Simplified CloudSyncStatus.vue
✅ Updated settings UI

### 5. Testing & Cleanup (IN PROGRESS)
✅ Added integration tests
✅ Remove old implementation:
  ✅ Remove src/composables/cloud-sync/ directory (9 files)
  ✅ Remove outdated test files in tests/cloud-sync/ (7 files)
  ✅ Verify no imports of old code remain
✅ Document new approach

### 6. Debug Logging
- Ensure sync triggers log debug information on success or failure
- Update useCloudSync.js to provide verbose logging
- Verify logs appear in both development and production builds
- Ensure success logs are also displayed when sync completes
- Confirm logs appear in both development and production builds

## Success Criteria
✅ No classes, use composition pattern
✅ Clear separation of concerns
✅ Simpler error handling
✅ Maintainable test coverage

## Next Steps
1. Final verification:
   - Run all tests to ensure no regressions
   - Verify sync functionality works end-to-end
   - Check error handling scenarios
