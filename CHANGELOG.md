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
- Add language information to messages and extract it automatically to know current language.
- Length of persona name should be restricted to e.g. 32 characters to fit dropdown selection box.
- Avatars should be scaled down to save storage space. Unless stored as separate files, only once.

### [KNOWN-BUGS]
- Base_64 encoded images stored with messages cannot be shared after introducing blobs and objectURLs.
- When removing a persona; should check if it is used in messages and alert user.
- When settings are restored from last message, personas with same name or id are duplicated if prompt or avatar has changed in persona settings compared to persona in message.

## v2.2.6 - 2025-01-12
- Fixed error where downloaded Ollama models were not listed in TextGenerationSettings component.
- Fixed error where downloaded Ollama models were not listed in QuickSettings component.
- Fixed error where Ollama host address was not configured on service creation.
- Updated dependencies.

## v2.2.5 - 2025-01-11
- Updated button styles and formatting of the release notes in update available dialog.
- Refactored useAutoUpdater composable to contain all the backend communication logic.
- Refactored App.vue and Updater.vue component to focus on UI interactions and user feedback.
- Refactored Updater.vue by move UI elements to the template section and keeping the logic in the script section.

## v2.2.4 - 2025-01-11
- Added handler for `ResizeObserver` errors to suppress warnings such as `ResizeObserver loop completed with undelivered notifications`.
- Added the `iconColor` computed variable to `useHelpers` composable and updated components where needed.
- Added Updater component with improved UX and more informative application update flow.

## v2.2.3 - 2025-01-11
- Fixed bug in ProviderSettings where API key would not be hidden when clicking the hide/show toggle.
- Changed icons to SVG from web-fonts to decrease bundle size.
- Refactored all components to use Vuejs 3 Composition API with `\<script setup\>`
- Changed UserInput to sent question on `Enter`, instead of `Command`+`Enter`.
- Changed guiding text in UserInput to `Press Shift (⇧) + Enter (↵) for new line`
- Added support for retrieving previous user messages by pressing `up`/`down` key in UserInput.
- Fixed bug where UserInput did not allow "Shift+Enter" to create new lines in the input field.
- Added support for both multi-line navigation and message history navigation in UserInput.
- Updated Cargo dependencies.

## v2.2.2 - 2025-01-10
- Added support for the `@` alias in `vite.config.js` and updated import paths.
- Updated ollama to latest version (0.5.11) where `ollama ps` API is implemented.
- Fixed error where model status was not correct, i.e. running.
- Fixed error where all model actions were set in loading state, when any of the was triggered.
- Fixed error where model was deleted before user confirmed deletion in delete model flow.
- Added support for downloading multiple models by moving download handling to the model table.
- Added support for resuming model downloads after application restart.
- Added support for aborting model downloads.
- Updated package dependences.
- Fixed build error caused by `@intlify/unplugin-vue-i18n` with `jitCompilation` enabled as default from version `5.0.0` and introducing dev dependency to `typescript`.

## v2.2.1 - 2025-01-01
- Added support for displaying provider logos in ProviderSettings.
- Changed download button in Ollama Model Manager to be hidden until user enters model name.
- Changed Settings dialog to be fixed width to improve UX when editing a provider with many models.
- Refactored and simplified ProviderSettings by breaking out Ollama-related functions to a new composable useOllama.js.
- Refactored ProviderSettings by breaking out Ollama model management to a separate component.

## v2.2.0 - 2024-12-30
- Added support for in-app management of Ollama models.
- Fixed issue where i18n text for `Cloud sync not available` was not referenced correctly.
- Fixed issue in Ollama models dropdown, where `v-on` did not receive a valid object in the `q-item` within the `v-slot:option`.

## v2.1.2 - 2024-12-26
- Refactored settings related components to be located in Settings folder.
- Created a GeneralSettings component for the general application settings tab panel.
- Refactored the user avatar settings into its own component.
- Added a feature in ProviderSettings which allows the user to configure and restart Ollama to make sure its accepts API calls from this application.
- Refactored capabilities by splitting platform specific permissions into separate files.
- Updated translations to align with current functionality.

## v2.1.1 - 2024-12-25
- Enhanced iCloud sync with improved conflict detection and resolution.
- Added client identification solution for better sync coordination.
- Added sequence numbering for precise sync ordering.
- Added monthly backup preservation system.
- Added sync metadata tracking per client.
- Improved file locking mechanism for safer concurrent operations.
- Improved timestamp precision using milliseconds.
- Implemented more robust cleanup strategy for old sync files.
- Added `sync now`button to Cloud sync setting panel.

## v2.1.0 - 2024-12-25
- Added support for cloud sync of application data such as settings, personas, and conversations. This is available for Mac users using iCloud.

## v2.0.3 - 2024-12-23
- Updated application icon to be in line with Apple guidelines.

## v2.0.2 - 2024-12-23
- Fixed bug where Linux build failed, due to wrong Ubuntu version in release script.

## v2.0.1 - 2024-12-23
- Fixed bug where build could not be signed for Mac OSX due to wrong Tauri signing key environment variables in release script.

## v2.0.0 - 2024-12-23
- Migrated to Tauri v2.
- Fixed notification issue for errors with no language translations.
- Fixed issue application got stuck in loading state when no persona was selected.
- Removed entitlements.mac.plist as it was already covered by entitlements.plist.
- Removed tray icon support as it had no functionality.

## v1.12.2 - 2024-06-02
- Merged dependabot PR:s fixing some voulnerabilities.
 
## v1.12.1 - 2024-06-02
- Fixed issue in UserInput component where messages with whitespace characters only were sent.
- Updated Tauri packages to latest versions.
- Updated frontend packages to latest versions.
- Changed model icon from mdi-brain to mdi-creation.

## v1.12.0 - 2024-06-01
- Updated prompt for conversation title generation to be more concise and to not use markdown.
- Added streamed response setting to QuickSettings.
- Changed user input to multi-row text box with auto-grow, allowing user to add new lines when pressing Enter. Ctrl+Enter sends the message.
- Refactored Settings component. Created TextGenerationSettings and ImageGenerationSettings components. 
- Fixed conversation mode on/off settings visible in image generation mode.
- Fixed issue where text generation models were shown in QuickSettings when image generation was active and user clicked the Dall-e chip.
- Fixed issue where calling logger() with multiple arguments did not print to console.

## v1.11.1 - 2024-05-28
- Added API provider name to QuickSettings select options.
- Added additional error logs for API responses.

## v1.11.0 - 2024-05-27
- Added info about the API provider to the model selection in Settings and QuickSettings.
- Added Swedish and Hungarian translations of provider settings texts.
- Changed loading of API providers in Settings and QuickSettings to be reactive.

## v1.10.0 - 2024-05-26
- Added support for local LLMs using Ollama and OpenAI API-format.

## v1.9.0 - 2024-05-23
- Removed QMarkdown component using Prism.js.
- Added markdown-it composable with highlight.js as code highlighter.
- Added copy button to code blocks.
- Changed streaming response handler to use the markdown-it composable.
- Added then().catch() to copy/share conversation.
- Added support for getting token usage from streamed responses.
- Added info button to QuickSettings to show token usage.
- Fixed text reference for image style vivid.
- Fixed an issue where conversation title was not generated when streamed response was active.

## v1.8.0 - 2024-05-21
- Added conversation mode toggle to QuickSettings.
- Changed conversation copy/share to export text instead of a JSON object.
- Changed image action button highlights to square.
- Updated tauri GitHub Actions script to latest, to fix missing builds for x86_64-apple-darwin.

## v1.7.0 - 2024-05-20
- Added copy, share, and delete actions to QuickSettings.
- Removed Beta label from streamed responses setting.
- Added UI support for API Provider selection in settings. However, only OpenAI is supported right now.
- Arranged settings in tabs: General, API Provider, Text generation, and Image generation

## v1.6.2 - 2024-05-19
- Changed QuickSettings model selection to display available models.
- Removed old models.

## v1.6.1 - 2024-05-19
- Updated Cargo dependencies
- Added GPT-4o
- Removed personas from individual messages to speed up loading and decrease storage space per message.

## v1.6.0 - 2024-02-06
- Updated dependencies to their latest versions.
- Added GPT-4 Turbo

## v1.5.4 - 2024-02-05
- Added logger.js, a simple wrapper of calls to webview console logs and tauri-plugin-log-api.
- Changed all logs to use logger.js.
- Changed log level to 'info' and above in Tauri backend.
- Fixed issue where "Stop generation" tooltip was shown instead of "Generating..." when generating images.
- Fixed issue where "Stop" tooltip was not available in Hungarian and Swedish during text generation.
- Changed "Stop generation" tooltip text to "Stop" to fit in tooltip box.
- Fixed issue where loading spinner could hang when generation got aborted during image generation.

## v1.5.3 - 2024-02-04
- Added possibility to stop text generation by clicking the loading spinner.

## v1.5.2 - 2024-02-04
- Fixed bug where show/hide menu icon tooltip was missing, causing an error in language texts and also causing the menu to be always shown on Linux.
- Aligned tooltip to the icons both when menu is hidden (toolbar mode) and when it's shown.

## v1.5.1 - 2024-02-04
- Added support for logs in production. Displayed in terminal, or stored in OS specific log folder. Linux: /home/alice/.config/com.tauri.dev; macOS: /Users/Alice/Library/Logs/com.tauri.dev; Windows: C:\Users\Alice\AppData\Roaming\com.tauri.dev


## v1.5.0 - 2024-01-29
- Added option to open/close left drawer.

## v1.4.2 - 2024-01-29
- Fixed issue where items from last year did not have a valid group in History list.
- Moved 'Clear messages' in current conversation button from Toolbar to Quick Settings, to avoid clicking it by mistake.
- Added new model gpt-4-turbo-preview with knowledge up until 2024-01-25.
- Added the loading indicator in the input field to be visible also when streaming responses.

## v1.4.1 - 2024-01-29
- Updated Node and Cargo package dependencies to their latest versions.
- Fixed CVE-2024-23331.

## v1.4.0 - 2023-12-01
- Updated dependencies to their latest versions.

## v1.3.5 - 2023-11-27
- Fixed error where streamed response messages were not stored in conversation.

## v1.3.4 - 2023-11-26
- Fixed error handling for interrupted response streams.
- Fixed bug where conversation title was not generated.
- Fixed bug where text color in light mode was changed correctly.

## v1.3.3 - 2023-11-26
- Fixed performance degradation and occasional UI crash when using streamed responses (beta).

## v1.3.2 - 2023-11-25
- Fixed issue where loading indicator was not shown when generating images.
- Added Beta badge for Stream response setting as it sometimes gets unexpectedly interrupted.

## v1.3.1 - 2023-11-18
- Changed loading indicator to be disabled when streaming response.

## v1.3.0 - 2023-11-18
- Added support for streamed responses to increase user experience.
- Fixed issue where switching to a conversation with images while having text generation activated changed the text generation model to dall-e.
- Fixed issue where image sizes not allowed by the API were set when restoring settings from igames generated by DALL-E-2.

## v1.2.0 - 2023-11-14
- Removed OpenAI API parameter options from persistent storage.
- Added image style settings to Settings component.

## v1.1.0 - 2023-11-09
- Added new text generation model GPT-4 Turbo (gpt-4-1106-preview).
- Added new image generation model DALL-E 3, along with image quality and image style settings.
- Disabled image choices for now, as DALL-E 3 does not support it.

## v1.0.1 - 2023-10-22
- Updated Tauri packages to latest versions.

## v1.0.0 - 2023-10-21
- Upgraded all packages their latest versions.
- Fixed CVE-2023-46115.
- Fixed LICENCE file reference.
- Updated database upgrade to operate directly and only on the database, not state values.
- Updated database upgrade to be synchronous.

## v0.25.3 - 2023-10-12
- Added extra tests to check if database migration was successful.

## v0.25.2 - 2023-10-12
- Added extra tests for database migration and also error notifications.

## v0.25.1 - 2023-10-12
- Fixed issue where images displayed in popup dialog did not scale responsively with the window. 
- Fixed issue where model settings info was removed from a message unintentionally.
- Fixed issue where invalid image references caused warnings in the console and longer image loading times.
- Fixed issue where images were stretched when smaller than preset view size, making the images blury.
- Fixed issue with database upgrades failing.

## v0.25.0 - 2023-10-11
- Fixed issue where showing conversation history was slow.
- Changed size of displayed images to 256x256.
- Changed number of images displayed per row to be responsive to application window width.
- Added popup dialog for showing images in full size.

## v0.24.4 - 2023-10-11
- Fixed some database migration issues.

## v0.24.3 - 2023-10-11
- Fixed issue where avatar tooltip was displaying unnecessary information.
- Added loading icon tooltip in input box.
- Added new database version in database upgrade notification.
- Added tooltip for avatars with no personas to show model name, e.g. DALL-E for image generation.
- Fixed issue where images stored in messages could not be shared.

## v0.24.2 - 2023-10-10
- Added option to show orphaned messages in conversation history, if there are any.
- Dependabot: Bump postcss from 8.4.27 to 8.4.31.

## v0.24.1 - 2023-10-09
- Added Swedish and Hungarian translation to database upgrade texts.
- Fixed issue where database upgrade dialog was still shown after upgrade and app restart.

## v0.24.0 - 2023-10-09
- Removed unused assets.
- Fixed bug where message timestamps were not unique.
- Moved image binaries from messages to separate imageDB as blobs with image name as key.
- Created migration script for the image data separation.

## v0.23.1 - 2023-10-02
- Changed icon set to svg-icons and removed unused imports to reduce bundle size.

## v0.23.0 - 2023-10-01
- (Re-)added application icons generated with TeamAI and DALL·E.

## v0.22.4 - 2023-10-01
- Reverted upgraded dependencies to their latest versions as of v0.21.3 to check if this is the reason for notarization errors.

## v0.22.2 - 2023-10-01
- Removed exemple persona prompts from TeamAI GitHub repository. Using team-ai-examples repo instead. To check if this is the reason for notarization errors.

## v0.22.1 - 2023-10-01
- Reverted to Tauri app icons, to check if this is the reason for notarization errors.

## v0.22.0 - 2023-10-01
- Upgraded outdated dependencies to their latest versions.
- Added option to import exempel persona prompts from TeamAI GitHub repository.

## v0.21.3 - 2023-09-29
- Added additional OpenAI API error code handling.
- Fixed issue where text generation model was set to dall-e in QuickSettings after image generation.

## v0.21.2 - 2023-09-29
- Fixed issue where all images were deleted when deleting a message with images.

## v0.21.1 - 2023-09-29
- Fixed updater related translations.
- Fixed loading status not being updated correctly after image generation.
- Fixed issue with timestamps where image choices were not deleted as expected.

## v0.21.0 - 2023-09-28
- Added support for toggling team work in QuickSettings.
- Removed option for user input filtering in persona selection list in QuickSettings to simplify UX.
- Changed availability of persona selection in QuickSettings to advanced mode.
- Added support for displaying assistant name as tooltip when hovering over assistant avatar.
- Updated README.md with additional application description and features.
- Added separator between messages to clearly responses responses from different personas.

## v0.20.6 - 2023-09-24
- Repositioned update check notification to the top of the window.

## v0.20.5 - 2023-09-24
- Fixed issue where update check notification got stuck in loading state when available update was not installed.

## v0.20.4 - 2023-09-24
- Fixed issue where English and Hungarian translations for checking for updates got mixed up.

## v0.20.3 - 2023-09-24
- Fixed issue where manually checking for updates was not working as expected.
- Added indicator for image generation model in QuickSettings.

## v0.20.2 - 2023-09-19
- Redesigned QuickSettings to improve UX.

## v0.20.1 - 2023-09-14
- Added support for changing OpenAI model from QuickSettings.
- Auto hide QuickSettings slider when not in use for 30 seconds.
- Removed shadow below QuickSettings to make it more visually appealing.

## v0.20.0 - 2023-09-14
- Fixed bug where persona settings was not restored as expected when changing conversation.
- Added support for selecting multiple personas.
- Added support for displaying persona avatars in persona selection options.
- Added support for displaying persona prompt as tooltip in persona selection options in settings.
- Added support for displaying quick settings above/below user input based on chat direction.

## v0.19.1 - 2023-09-08
- Added indicators on hover to user avatar in settings.
- Fixed missing persona avatar related issues in settings and in messages.

## v0.19.0 - 2023-09-07
- Added support for displaying assistant avatars in conversations and in settings.
- Added support for assistant persona avatars.
- Added support for user avatar.

## v0.18.1 - 2023-09-05
- Fixed bug where image completion message was not deleted when last image choice was deleted.
- Fixed bug where second row of images loads after page scroll and ends up outside of page.
- Fixed bug where page scrolled to end when message was deleted.

## v0.18.0 - 2023-09-04
- Added support for storing relevant settings with assistant messages.
- Added support for restoring settings from last assistant message when changing conversation.
- Added support for indicating current conversation in the conversation history.

## v0.17.2 - 2023-08-27
- Added missing translations for personas and speech.
- Fixed issues where create new persona input fields were cleared on lost focus.

## v0.17.1 - 2023-08-27
- Fixed default locale formatting to be in line with language selector.
- Changed loading spinner to be more visible and better indicate activity.

## v0.17.0 - 2023-08-27
- Fixed issue where text-to-speech state affected all messages.
- Added visual indication of text-to-speech state.
- Added optional speech-to-text to user input, along with macOS entitlements for microphone access.
- Updated Privacy information to include text-to-speech and speech-to-text.
- Changed language selector to display languages instead of language codes.
- Fixed multiple system messages
- Added toggle of text in input box based on selection of text/image generation.

## v0.16.0 - 2023-08-17
- Added option to read message text aloud using text-to-speech. Only English in this release.

## v0.15.0 - 2023-08-14
- Added support for persisting and displaying API parameters, usage statistics, conversation mode, and system message(s) with each message.
- Fixed issue where image size was hard coded and settings did not have any effect.

## v0.14.4 - 2023-08-13
- Fixed issue where persona dialog with many peronas took several seconds to load. It is now instant.

## v0.14.3 - 2023-08-11
- Added filtering to personas selection in settings.
- Changed UX when adding new persona. Now, it is first edited, and added to the table only when saved.

## v0.14.2 - 2023-08-10
- Updated privacy information to link to OpenAI API data usage policies.
- Added search to personas and imported awesome prompts tables.

## v0.14.1 - 2023-08-03
- Changed save button color to improve UX when editing conversation title.
- Improved load speed of personas dialog from about 7s to less than 1s.
- Added support for sorting the personas table, and also the awesome prompts table.
- Fixed issue where import of awesome prompts had an empty last element.
- Added indication that it is possible to remove awsesome prompts.

## v0.14.0 - 2023-08-02
- Fixed issue where Awesome ChatGPT promts could not be shown if all previous personas were deleted.
- Fixed issue where default store values were not restored if missing in local storage.
- Added default persona with default system message. It is always included, and not editable or deletable.
- Added support for creating and editing personas. Available in advanced mode.
- Added persona selection in settings dialog. Available in advanced mode. Displays description as tooltip.
- Added translations for missing API error messages.

## v0.13.0 - 2023-07-31
- Added image generation parameters to settings dialog.
- Fixed share image to be correctly formatted, PNG.
- Fixed check of availability to share a message, now that images can have multiple choices.
- Fixed issue where save button had to be pressed twice to save changes to conversation title.
- Improved UX of selecting between text and image generation.

## v0.12.0 - 2023-07-30
- Added support for displaying multiple image choices.
- Added individual image actions: delete and share.
- Added native draggable support to images.
- Changed images generation output to b64_json, as URL expire after an hour.
- Fixed error caused when messages containing images were included when using conversation mode.
- Fixed error where conversation with image generations got titles unrelated to the conversation.

## v0.11.0 - 2023-07-24
- Changed message action items' layout to horizontal.
- Added check that sharing is indeed available and possible before showing share button.
- Added option to generate image from user input. Needs more work, but ready for early testing.

## v0.10.1 - 2023-07-24
- Added option to share a message or an entire conversation using native sharing.

## v0.10.0 - 2023-07-24
- Added option to edit the title of a conversation.
- Added option to copy a conversation to the clipboard.
- Fixed bug where page was not scrolled correctly on new message to get it into focus.
- Fixed bug where page scrollers were hidden behind user input field.
- Changed window width that triggers left drawer to become hidden. Set it 600px.

## v0.9.0 - 2023-07-23
- Added action buttons to messages: copy and delete.
- Changed history list delete button visual style to be aligned with message action buttons.

## v0.8.4 - 2023-07-23
- Added support for manually checking for updates. Enabled in toolbar in advanced mode.

## v0.8.3 - 2023-07-22
- Upgraded package dependencies.
- Removed Mermaid diagram support due to security issues in dependencies and low prio feature.

## v0.8.2 - 2023-07-22
- Fixed bug where clicking scroll-to-top/ -bottom arrows did not scroll to top/bottom all the way.

## v0.8.1 - 2023-07-22
- Changed loading state to be visualized in input field instead of with skeleton.
- Changed chat direction icon in settings to be more intuitive.
- Added alternating background colors for messages to make it more visually appealing.
- Improved UX of message list by scrolling to end of messages as soon as there is an update.

## v0.8.0 - 2023-07-19
- Moved top toolbar to left mini drawer.
- Made the chat direction configurable (up/down).
- Changed user input field to fill entire width of page.
- Changed the user input field location to top/bottom of the chat window, depending on chat direction.
- Fixed a rare bug where the chat title response had an optionally escaped leading and trailing apostrophes.

## v0.7.5 - 2023-07-14
- Added application mode toggle for basic or advanced, to hide or show persona and team related features.

## v0.7.4 - 2023-07-13
- Updated component headers and width to have same UX.
- Updated default size of the application to be HD Ready, i.e. 1280x720 pixels.
- Added more detailed application information.
- Fixed bug where messages were not deleted when clear messages button was clicked.
- Fixed bug where icon color was being set with undefined function.

## v0.7.3 - 2023-07-13
- Fixed bug where newly created conversations could not be grouped in conversation history.

## v0.7.2 - 2023-07-13
- Fixed bug where messages could be listed on wrong order because of wrong timestamp format.
- Fixed bug where dialogs could not be closed if window was too narrow.
- Changed the format of timestamps in conversation history. This may affect the order of existing items.
- Added localized grouping of conversation history based on age, with most recent on top.

## v0.7.1 - 2023-07-03
- Fixed bug where comma in the text broke imported prompts.

## v0.7.0 - 2023-07-03
- Added Personas component to manage personas.
- Added support for importing Awesome ChatGPT prompts, which can be added and used as personas.
- Added support for deleting personas.
- Added but not yet implemented support for creating new and editing existing personas.

## v0.6.0 - 2023-07-02
- Moved application information to separate component.
- Added new conversation button.
- Added automatic generation of conversation title after first response.
- Added persistence of conversation history.
- Added support for deleting conversations from history.
- Changed clear messages to now clear messages only for current conversation.

## v0.5.0 - 2023-06-28
- Added Show conversation history, although individual conversations are not saved yet.
- Changed most icons to Material Design icons.

## v0.4.1 - 2023-06-26
- Fixed issue where user selected language was not loaded on application start.

## v0.4.0 - 2023-06-26
- Added new languages, Swedish and Hungarian, and language switcher in settings dialog.
- Added brief application description shown when info icon is clicked.

## v0.3.4 - 2023-06-26
- Added more information about the application to the bundle configuration.

## v0.3.3 - 2023-06-25
- Changed colors slightly to better adapt to dark/light mode.

## v0.3.2 - 2023-06-25
- Added conversation mode setting, i.e. to send individual messages or entire conversation history.
- Fixed issue where UI remained in loading state after error.
- Added timestamp and conversationId to messages.

## v0.3.1 - 2023-06-23
- Message history is now persisted across application restarts.
- Added a button to clear message history.
- Fixed issue where user input was not cleared after being handled.

## v0.3.0 - 2023-06-22
- Added support for markdown and syntax highlighting in chat messages.
- Added user and assistant avatars in messages.
- Fixed some dark mode issues.

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
