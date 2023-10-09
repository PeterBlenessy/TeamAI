<template>
    <div v-for="message in filteredMessages" :key="message.timestamp" scroll>
        <q-card flat square :class="'message-card ' + getBgColor(message.role)">
            <q-item top dense>

                <!-- Message avatar -->
                <q-item-section avatar top>
                    <q-avatar v-if="message.role == 'user'" size="xl">
                        <q-img v-if="userAvatar" :src="userAvatar" />
                        <q-icon v-else rounded size="xl" name="mdi-account-circle" :color="iconColor" />
                    </q-avatar>

                    <q-avatar v-if="message.role == 'assistant'" size="xl">
                        <q-img v-if="getAssistantAvatar(message)" :src="getAssistantAvatar(message)" />
                        <q-icon v-else rounded size="xl" name="mdi-account-circle" :color="iconColor" />
                        <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                            {{ getAssistantName(message) }}
                        </q-tooltip>
                    </q-avatar>
                </q-item-section>

                <!-- Message content -->
                <q-item-section top>
                    <!-- Is 'choices' a key in message object. Images are stored in choices: [{ index, content }] -->
                    <div v-if="hasChoices(message) && message.object == 'image'">
                        <div class="q-pa-md">
                            <div class="q-col-gutter-md row justify-center items-start">
                                <!-- Iterate through the image choices -->
                                <div v-for="(item) in message.choices" :key="item.content">
                                    <div class="col-6 ">
                                        <q-card flat square :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
                                            <q-card-section horizontal>
                                                <!-- Display image -->
                                                <q-img loading="lazy" :ratio="1" width="400px" draggable :id="item.content"
                                                    placeholder-src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWBAMAAADOL2zRAAAAG1BMVEXMzMyWlpaqqqq3t7fFxcW+vr6xsbGjo6OcnJyLKnDGAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABAElEQVRoge3SMW+DMBiE4YsxJqMJtHOTITPeOsLQnaodGImEUMZEkZhRUqn92f0MaTubtfeMh/QGHANEREREREREREREtIJJ0xbH299kp8l8FaGtLdTQ19HjofxZlJ0m1+eBKZcikd9PWtXC5DoDotRO04B9YOvFIXmXLy2jEbiqE6Df7DTleA5socLqvEFVxtJyrpZFWz/pHM2CVte0lS8g2eDe6prOyqPglhzROL+Xye4tmT4WvRcQ2/m81p+/rdguOi8Hc5L/8Qk4vhZzy08DduGt9eVQyP2qoTM1zi0/uf4hvBWf5c77e69Gf798y08L7j0RERERERERERH9P99ZpSVRivB/rgAAAABJRU5ErkJggg=="
                                                    :src="getImage(item.content)" @error="(event) => onImageError(event)" />

                                                <!-- Image actions -->
                                                <q-card-actions vertical class="justify-around">
                                                    <q-btn size="sm" flat dense round icon="mdi-export-variant"
                                                        :color="iconColor" @click="shareMessage(item, message.object)">
                                                        <q-tooltip :delay="750" transition-show="scale"
                                                            transition-hide="scale">
                                                            {{ $t("messages.tooltip.share") }}
                                                        </q-tooltip>
                                                    </q-btn>
                                                    <q-btn size="sm" flat dense round icon="mdi-delete-outline"
                                                        :color="iconColor"
                                                        @click="deleteChoice(message.timestamp, message.role, item.index)">
                                                        <q-tooltip :delay="750" transition-show="scale"
                                                            transition-hide="scale">
                                                            {{ $t("messages.tooltip.delete") }}
                                                        </q-tooltip>
                                                    </q-btn>

                                                </q-card-actions>
                                            </q-card-section>
                                        </q-card>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User messages and text completions do not support multiple choices and are stored as 'content'.  -->
                    <div v-else>
                        <q-markdown :src="message.content" :plugins="mdPlugins" />
                    </div>
                </q-item-section>

                <!-- Message actions -->
                <q-item-section side top>
                    <div class="q-gutter-xs">
                        <div class="column items-end">
                            <div class="col">
                                <q-btn v-if="message.object != 'image'" size="sm" flat dense icon="mdi-content-copy"
                                    :color="iconColor" @click="copyMessage(message)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ $t("messages.tooltip.copy") }}
                                    </q-tooltip>
                                </q-btn>

                                <q-btn v-if="message.object != 'image'" size="sm" flat dense icon="mdi-export-variant" :color="iconColor"
                                    @click="shareMessage(message)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ $t("messages.tooltip.share") }}
                                    </q-tooltip>
                                </q-btn>

                                <q-btn size="sm" flat dense icon="mdi-delete-outline" :color="iconColor"
                                    @click="deleteMessage(message.timestamp, message.role)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ $t("messages.tooltip.delete") }}
                                    </q-tooltip>
                                </q-btn>
                            </div>
                        </div>
                        <div class="column items-end">
                            <div class="col">
                                <q-btn v-if="message.role != 'user' && message.object != 'image'" size="sm" flat dense
                                    color="iconColor" icon="mdi-play-circle-outline"
                                    :loading="readingMessage == message.timestamp" @click="startSpeech(message)">

                                    <template v-slot:loading>
                                        <q-spinner-bars @click.stop="stopSpeech(message)" color="primary" />
                                    </template>

                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ readingMessage == message.timestamp ? $t("messages.tooltip.stop")
                                            : $t("messages.tooltip.speak") }}
                                    </q-tooltip>
                                </q-btn>
                                <q-btn v-if="message.role != 'user'" size="sm" flat dense icon="mdi-information-outline"
                                    :color="iconColor" @click="showMessageInfo(message)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ $t("messages.tooltip.info") }}
                                    </q-tooltip>
                                </q-btn>
                            </div>
                        </div>
                    </div>
                </q-item-section>
            </q-item>
        </q-card>
        <q-separator />
    </div>
</template>

<script>
import { useTeamsStore } from "../stores/teams-store.js";
import { useSettingsStore } from "../stores/settings-store.js";
import { storeToRefs } from "pinia";
import { QMarkdown } from "@quasar/quasar-ui-qmarkdown";
import "@quasar/quasar-ui-qmarkdown/dist/index.css";
import { useQuasar } from "quasar";
import { computed, ref, watch } from "vue";
import { scroll } from "quasar";
import { useI18n } from 'vue-i18n';
import { imageDB } from "../services/localforage";

export default {
    name: "Messages",
    components: {
        QMarkdown,
    },
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const teamsStore = useTeamsStore();
        const { loading, conversationId, messages, images } = storeToRefs(teamsStore);
        const settingsStore = useSettingsStore();
        const { chatDirection, speechLanguage, userAvatar } = storeToRefs(settingsStore);

        // Page should scroll to end (latest message), only when new messages are added.
        let shouldScroll = true;

        // Get message background color
        const getBgColor = (role) => {
            return role == "user"
                ? $q.dark.isActive
                    ? "bg-grey-8"
                    : "bg-grey-1"
                : $q.dark.isActive
                    ? "bg-grey-9"
                    : "bg-grey-3";
        };
        // Filter messages for specified conversationId
        const filteredMessages = computed(() => {
            let temp = messages.value.filter((message) => message.conversationId == conversationId.value);

            return chatDirection.value == "up" ? temp : temp.reverse();
        });

        // Restore settings from last message in conversation
        const restoreSettings = () => {
            const settings = teamsStore.getSettingsFromLastMessage(conversationId.value);

            if (settings) {
                if (settings.model == "dall-e") delete settings.model;
                settingsStore.$patch(settings);
            }
        };

        // Load messages from conversationId
        watch(conversationId, () => {
            restoreSettings();
            filteredMessages;
        });

        // Scroll new message into view
        watch(
            filteredMessages,
            () => {
                if (shouldScroll) {
                    const { getScrollTarget, setVerticalScrollPosition } = scroll;

                    const page = document.getElementById("page");
                    const target = getScrollTarget(page);
                    const offset = chatDirection.value == "up" ? page.offsetHeight : 0;
                    setVerticalScrollPosition(target, offset, 100);
                } else {
                    shouldScroll = true;
                }
            },
            { flush: "post" }
        );

        // Check if message has 'choices' key, used to store array of generated images
        const hasChoices = (message) => message.hasOwnProperty('choices');

        // Return message content or first item in 'choices' array, if present
        // todo: include all image choices when sharing?
        const getContent = async (message, type = 'text') => {
            let content = hasChoices(message)
                ? message.choices[0].content
                : message.content;

            if (type == 'image' || message.object == 'image') {
                const blob = await imageDB.getItem(content);
                const imageFile = new File([blob], content+'.png', { type: "image/png" });

                return imageFile;
            } else {
                return content;
            }
        };

        // Copy message content to clipboard. Only for text content.
        // Tauri user agent does not allow images to be copied to the clipboard.
        const copyMessage = async (message, messageType = 'text') => {
            const type = (messageType == 'text') ? "text/plain" : "image/png";
            const content = await getContent(message, messageType);
            const blob = new Blob([content], { type });
            const data = [new ClipboardItem({ [type]: blob })];

            try {
                await navigator.clipboard.write(data);
            } catch (error) {
                console.log(error);
            }
        };

        // Share message content via 'navigator.share', the native sharing mechanism
        const shareMessage = async (message, type = 'text') => {
            try {
                await navigator.share(
                    message.object == 'image' || type == 'image'
                        ? { files: [await getContent(message, 'image')] }
                        : { text: await getContent(message) }
                );
            } catch (error) {
                console.log(error);
            }
        };

        // Show message info
        const showMessageInfo = (message) => {
            let info = `
                <div class="text-subtitle1">${t('messages.info.timestamp')}</div>
                <div class="text-caption">${Date(message.timestamp)}</div>
            `;

            if (message.usage) info += `<br />
                <div class="text-subtitle1">${t('messages.info.usage')}</div>
                <div class="text-caption"><pre>${JSON.stringify(message.usage, null, 2)}</pre></div>
            `;

            if (message.systemMessages) info += `<br />
                <div class="text-subtitle1">${t('messages.info.systemMessages')}</div>
                <div class="text-caption"><pre>${JSON.stringify(message.systemMessages, null, 2)}</pre></div>
            `;

            if (message.settings) info += `<br />
                <div class="text-subtitle1">${t('messages.info.settings')}</div>
                <div class="text-caption"><pre>${JSON.stringify(message.settings, null, 2)}</pre></div>
            `;

            $q.dialog({
                title: t('messages.info.title'),
                message: info,
                html: true,
                cancel: false,
                persistent: false,
                ok: {
                    label: 'Ok',
                    color: 'primary',
                    flat: true
                }
            });
        };

        // The message being read out loud
        const readingMessage = ref('');

        // Speak message content
        const startSpeech = async (message) => {
            const content = message.content;
            const utterance = new SpeechSynthesisUtterance(content);

            utterance.lang = speechLanguage.value;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => {
                readingMessage.value = '';
            };
            utterance.onerror = (event) => {
                console.log("Error: " + event.error + " - " + event.message);
                readingMessage.value = '';
            };

            // Check if there is already speechSynthesis is ongoing and cancel it
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
            // Speak message content
            speechSynthesis.speak(utterance);
            readingMessage.value = message.timestamp;
        };

        const stopSpeech = (message) => {
            speechSynthesis.cancel();
            readingMessage.value = '';
        }

        const getAssistantAvatar = (message) => {
            let persona = null;

            if ('settings' in message) {
                // Note: handle persona == null. A persona is set on message, but has been deleted from personas array
                persona = 'persona' in message.settings ? teamsStore.getPersona(message.settings.persona.id)
                    : 'personas' in message.settings ? teamsStore.getPersona(message.settings.personas[0].id)
                        : null;

                if (persona && 'avatar' in persona) {
                    return persona.avatar;
                }
            }
            return null;
        }

        const getAssistantName = (message) => {
            let persona = null;

            if ('settings' in message) {
                // Note: handle persona == null. A persona is set on message, but has been deleted from personas array
                persona = 'persona' in message.settings ? teamsStore.getPersona(message.settings.persona.id) : null;

                return (persona && 'name' in persona) ? persona.name : null;
            }
            return null;
        }

        const getImage = (imageName) => {

            // Check if image is b64 data
            if (imageName.startsWith('data:image')) {
                return imageName;
            }

            let [image] = images.value.filter(item => item.imageName == imageName);
            if ('imageURI' in image) {
                return image.imageURI;
            } else {
                return '';
            }
        }

        // Handle <img @onError(event) triggered for invalid object URLs.
        // Regenerate object URLs stored in images array and revoked when application restarts.
        const onImageError = async (event) => {
            // console.log(event);
            // console.log(event.target.src);
            let imageName = images.value.filter(item => item.imageURI == event.target.src)[0].imageName;
            let blob = await imageDB.getItem(imageName);
            let imageURI = URL.createObjectURL(blob);
            for (let i = 0; i < images.value.length; i++) {
                if (images.value[i].imageURI == event.target.src) {
                    images.value[i].imageURI = imageURI;
                    break;
                }
            }
        }

        return {
            slide: ref(0),
            chatDirection,
            filteredMessages,
            getBgColor,
            iconColor: computed(() => ($q.dark.isActive ? "grey-4" : "grey-8")),
            loading,
            mdPlugins: [],
            hasChoices,
            copyMessage,
            shareMessage,
            deleteMessage: (timestamp, role) => { teamsStore.deleteMessage(timestamp, role); shouldScroll = false; },
            deleteChoice: (timestamp, role, index) => {
                teamsStore.deleteChoice(timestamp, role, index);
                if (teamsStore.getMessage(timestamp, role).choices.length == 0) {
                    teamsStore.deleteMessage(timestamp, role);
                }
                shouldScroll = false;
            },
            showMessageInfo,
            startSpeech,
            stopSpeech,
            readingMessage,
            userAvatar,
            getAssistantAvatar,
            getAssistantName,
            images,
            getImage,
            onImageError
        };
    },
};
</script>

<style>
/* General card styling */
.message-card {
    padding-bottom: 10px;
    padding-top: 10px;
}

/* Markdown div styling */
.q-markdown {
    padding-left: 50px;
    padding-right: 50px;
}
</style>
