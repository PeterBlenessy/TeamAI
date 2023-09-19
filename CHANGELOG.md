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
- Add language information to messages.

### [MAJOR]

### [MINOR]

### [PATCH]

### [KNOWN-BUGS]
- Manual check for updates is not working as expected.
- ResizeObserver loop completed with undelivered notifications. https://github.com/quasarframework/quasar/issues/2233#issuecomment-1719873402
- Length of persona name should restricted to e.g. 32 characters.
- Avatars should be scaled down to save storage space. Unless stored as separate files, only once.
- Should make iconColor() a utility function.
- Personas cannot be removed in QuickSettings when outside of col-6 boundary.

## [UNRELEASED]

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