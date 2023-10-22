# TeamAI

The TeamAI application allows the user to create a team of OpenAI powered bots with individual capabilities, personas. The bots will solve the task requested by the user as a team effort, each bot contributing with its respective capabilities.

<img width="640" alt="TeamAI Screenshot" src="https://github.com/PeterBlenessy/TeamAI/assets/22810267/e0670494-064f-41de-8e01-c356f13ba978">
<img width="320" alt="Version Screenshot" src="https://github.com/PeterBlenessy/TeamAI/assets/22810267/22116de9-e6eb-4e86-af91-b9b5a19112b0">

The application is based on [tauri-app-boilerplate](https://github.com/PeterBlenessy/tauri-app-boilerplate) and uses [Tauri](https://tauri.app), [Vue 3](https://vuejs.org), [Quasar](https://quasar.dev), and [Vite](https://vitejs.dev).


## Features
- [x] OpenAI API parameter settings
- [x] Conversations using OpenAI chat completion API
- [x] Conversation history
- [x] Generate images using DALL·E
- [x] Personas with specific bahaviour and competence
- [x] Import Awesome Chat GPT prompts to use as personas
- [x] Teams of personas to solve a specific objective
- [x] Message actions (copy, share, delete, etc.)
- [x] Speech synthesis using Web Speech API
- [x] Avatars
- [ ] Templates

The application has a basic and an advanced mode, toggled in the application settings.

In **basic mode**, the user receives responses from the default persona. The user cannot select another persona, in fact, the concept of personas is not available in the UI. The user can try to influence the GPT bot to behave in a desired way by describing it in the user input.

In **advanced mode**, the user has the option to create personas and select one or several to be included in the conversation. When several personas are selected, each will provide a response to the question asked by the user. During the course of the conversation, the user can activate **team work**. This will lead to the user's question only being sent to the first persona, and the next getting the response from the first as question, and so on.

## Contributions
Contributions, issues and feature requests are welcome!

### Getting started

* Clone the repo or download the [zip-archive](https://github.com/PeterBlenessy/TeamAI/archive/refs/heads/master.zip) and unpack it.
* Install [prerequisites for developing Tauri apps](https://tauri.app/v1/guides/getting-started/prerequisites)
* Run `yarn tauri dev` to launch the app.

### Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### Changelog
See [CHANGELOG.md](CHANGELOG.md).

## License
This project is [MIT](LICENSE) licensed.
