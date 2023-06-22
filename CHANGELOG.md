# Changelog
All notable changes to this project will be documented in this file.

## Changelog format guideline
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### vMAJOR.MINOR.PATCH - YYYY-MM-DD

- Added new features.
- Changed existing functionality.
- Deprecated soon-to-be removed features.
- Removed features.
- Fixed bugs.
- Security in case of vulnerabilities.

## [BACKLOG]

### [MAJOR]

### [MINOR]

### [PATCH]

## v0.2.x - [UNRELEASED]

## v0.2.0 - 2023-06-22
- Added system tray icon. When clicked, the application is shown and focused.
- Added improved description in README.md.
- Added Messages component to handle display of messages.
- Created OpenAI component to handle OpenAI API communication and related error notifications.

## v0.1.5 - 2023-06-21
- Added basic OpenAI API wrapper supporting chat completions.
- Added simple visualization of question and answer.

## v0.1.4 - 2023-06-10
- Fixed typo in updater endpoint.

## v0.1.3 - 2023-06-10
- Changed back title bar style to visible as drag area was not wasy to find.
- Added persistent storage using localForage.

## v0.1.2 - 2023-06-07
- Added settings component and store for application wide configuration.
- Changed dark mode toggling to use the application settings store.

## v0.1.1 - 2023-06-06
- Fixed window flashing on startup.
- Changed title bar style to overlay.
- Fixed CVE-2023-34092.
- Changed tooltip delay to get a better UX.

## v0.1.0 - 2023-06-02
- Removed Greet component that comes with the boilerplate.
- Added [Quasar as a Vite plugin](https://quasar.dev/start/vite-plugin#installation).
- Added [Pinia](https://pinia.vuejs.org) for state management.
- Added [vue-i18n@9](https://vue-i18n.intlify.dev) for internationalization.
- Added Dark mode toggle.
- Added UserInput component.
- Added tooltips to clickable icons.

## v0.0.1 - 2023-05-26
- Initial release based on [tauri-app-boilerplate](https://github.com/PeterBlenessy/tauri-app-boilerplate)