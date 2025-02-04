# System Patterns

## Architecture
- Frontend: Vue.js 3 Single Page Application
- Backend: Tauri v2 native system integration
- State Management: Vue stores with LocalStorage persistence
- Services Layer: Modular service architecture

## Key Patterns
1. Composables
   - useCloudSync: iCloud drive synchronization
   - useOllama: Local Ollama model integration
   - useHelpers: Shared utility functions
   - useLogger: System logging and debugging
   - useUpdater: Application version management

2. Services
   - iCloudService: Local iCloud drive integration
   - DatabaseUpgrader: Schema version migrations
   - SyncStateManager: Cloud sync coordination
   - Providers: Modular AI provider interfaces

3. Components
   - Settings: Hierarchical settings management
   - Messages: Realtime chat interface
   - History: Local conversation management
     - Timestamp-based conversation sorting (updated/created)
     - Smart date-based grouping
     - Cross-device sync compatibility
   - Personas: AI personality configuration
   - Quasar v2: UI framework integration

## Technical Decisions
1. Tauri v2 for Native Features
   - Secure file system access
   - Cross-platform system integration
   - Native performance optimization

2. Local-First Architecture
   - LocalForage primary storage
   - LocalStorage for settings
   - iCloud drive sync for multi-device sync
   - Offline-capable design
   - Optimized asset storage (avatars, images)
   - Background processing for heavy operations

3. Performance Optimization
   - Web Worker integration for model downloads
   - Blob/ObjectURL management for images
   - Efficient persona data handling
   - Optimized Ollama communication

4. Modular Settings
   - Provider-specific configurations
   - User preferences persistence
   - Team sync preferences
   - Multi-language support
