# Backlog

## [FEATURES]
- Add language information to messages and extract it automatically to know current language.
- Length of persona name should be restricted to e.g. 32 characters to fit dropdown selection box.
- Avatars should be scaled down to save storage space. Unless stored as separate files, only once.

## [REFACTORING-IDEAS]
- Use `worker` for dowloading models; the UI freezes when multiple models are being downloaded and Ollama is "working hard"
- Improve error handling of Ollama communication; UI freezes when ollama is not responsive, i.e. if downloading mutiple models and chatting
- Add support for OLLAMA_KEEP_ALIVE environment variable when starting Ollama, -1

## [KNOWN-BUGS]
- Base_64 encoded images stored with messages cannot be shared after introducing blobs and objectURLs.
- When removing a persona; should check if it is used in messages and alert user.
- When settings are restored from last message, personas with same name or id are duplicated if prompt or avatar has changed in persona settings compared to persona in message.

