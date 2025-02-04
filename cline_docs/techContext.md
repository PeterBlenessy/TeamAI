# Technical Context

## Technologies
- Frontend: Vue.js 3.0 with Vite
- Backend: Tauri v2 (Rust)
- Storage: LocalForage, iCloud sync (local iCloud drive)
- AI Integration: OpenAI API, Ollama
- Build System: Rust/Cargo + Node.js
- UI Components: Custom Vue components, Quasar v2
- State Management: Custom stores, LocalStorage

## Development Setup
- Node.js environment for frontend
- Rust/Cargo for Tauri backend
- Package management: Yarn
- Development server: Vite
- Build target: Desktop (macOS, Windows, Linux)

## Technical Constraints
- Must support cross-platform deployment
- Requires local storage capabilities
- Needs network access for AI APIs
- Must handle cloud sync conflicts
- Requires system-level file access
- Must manage different AI provider configurations
