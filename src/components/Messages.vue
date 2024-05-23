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


                                <div v-for="(item) in message.choices" :key="item.content">
                                    <div class="col-auto ">
                                        <q-card flat square :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
                                            <q-card-section horizontal>
                                                <img id="item.content" />
                                            </q-card-section>
                                        </q-card>
                                    </div>
                                </div>


                                <!-- Iterate through the image choices -->
                                <div v-for="(item) in message.choices" :key="item.content">
                                    <div class="col-auto ">
                                        <q-card flat square :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">


                                            <q-card-section horizontal>
                                                <!-- Display image -->

                                                <!-- Base64 image -->
                                                <img v-if="item.content.startsWith('data:image')" style="width: 256px"
                                                    loading="lazy" :src="item.content" />

                                                <!-- Image name; image stored in imageDB -->
                                                <img v-else style="width: 256px" loading="lazy"
                                                    :id="loadImage(item.content)" @click="showImage(item.content)" />

                                                <!-- Image actions -->
                                                <q-card-actions vertical class="justify-around">
                                                    <q-btn size="sm" flat dense padding="xs" icon="mdi-export-variant"
                                                        :color="iconColor" @click="shareMessage(item, message.object)">
                                                        <q-tooltip :delay="750" transition-show="scale"
                                                            transition-hide="scale">
                                                            {{ $t("messages.tooltip.share") }}
                                                        </q-tooltip>
                                                    </q-btn>
                                                    <q-btn size="sm" flat dense padding="xs" icon="mdi-delete-outline"
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
                        <!-- <q-markdown :id="'content-'+message.timestamp" no-heading-anchor-links :src="message.content" :plugins="mdPlugins" /> -->
                        <div :id="'content-' + message.timestamp" v-html="markdown.render(message.content)"
                            class="md-body"></div>
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

                                <q-btn v-if="message.object != 'image'" size="sm" flat dense icon="mdi-export-variant"
                                    :color="iconColor" @click="shareMessage(message)">
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
                                        {{ readingMessage == message.timestamp ? $t("messages.tooltip.stop") :
        $t("messages.tooltip.speak") }}
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

    <!-- Popup dialog to show full sized image -->
    <q-dialog v-model="showImageDialog">
        <q-card style="width: 1024px; height: auto; max-width: 90vh; max-height: 90vw;">
            <q-img :src="imageSrc" @click="showImageDialog = false" style="" />
        </q-card>
    </q-dialog>
</template>

<script>
import { useTeamsStore } from "../stores/teams-store.js";
import { useSettingsStore } from "../stores/settings-store.js";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import { computed, ref, watch } from "vue";
import { scroll } from "quasar";
import { useI18n } from 'vue-i18n';
import { imageDB } from "../services/localforage";
import openaiConfig from '../services/openai.config.json';
import logger from '../services/logger.js';
import { useMarkdown } from '../composables/markdown.js'

export default {
    name: "Messages",
    components: {},
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const teamsStore = useTeamsStore();
        const { loading, conversationId, messages } = storeToRefs(teamsStore);
        const settingsStore = useSettingsStore();
        const { chatDirection, speechLanguage, userAvatar } = storeToRefs(settingsStore);

        const markdown = useMarkdown();

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
            let temp = conversationId == ''
                ? teamsStore.getOrphanedMessages()
                : messages.value.filter((message) => message.conversationId == conversationId.value);

            return chatDirection.value == "up" ? temp : temp.reverse();
        });

        // Restore settings from last message in conversation
        const restoreSettings = () => {
            let settings = teamsStore.getSettingsFromLastMessage(conversationId.value);

            if (settings) {
                // Avoid setting dall-e as model for text generation
                if (settings.model.startsWith("dall-e")) delete settings.model;
                // Do not set image sizes other than the ones allowed by the API
                if (!openaiConfig.imageSizeOptions.includes(settings.imageSize)) delete settings.imageSize;

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
                let blob;
                if (content.startsWith('data:image')) {
                    // base64 image
                    blob = await fetch(content).then(r => r.blob());
                } else {
                    // Image name
                    blob = await imageDB.getItem(content);
                }
                const imageFile = new File([blob], content + '.png', { type: "image/png" });

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

            navigator.clipboard.write(data)
                .then(() => logger.log('Copied to clipboard'))
                .catch((error) => logger.log(error));
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
                logger.error(error);
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
                logger.log("Error: " + event.error + " - " + event.message);
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
                persona = 'persona' in message.settings
                    ? teamsStore.getPersona(message.settings.persona.id)
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
                persona = 'persona' in message.settings
                    ? teamsStore.getPersona(message.settings.persona.id)
                    : null;

                return (persona && 'name' in persona)
                    ? persona.name
                    : 'model' in message.settings
                        ? message.settings.model.toUpperCase()
                        : null;
            }
            return null;
        }

        // Pupup dialog to show full sized image
        const showImageDialog = ref(false);
        const imageSrc = ref('');

        return {
            slide: ref(0),
            chatDirection,
            filteredMessages,
            getBgColor,
            iconColor: computed(() => ($q.dark.isActive ? "grey-4" : "grey-8")),
            loading,
            markdown,
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
            showImageDialog,
            imageSrc,
            showImage: (imageName) => {
                showImageDialog.value = true;
                const imageId = document.getElementById(imageName);
                imageSrc.value = imageId.src;
            },
            loadImage: (imageName) => {
                imageDB.getItem(imageName).then(blob => {
                    const imageURI = URL.createObjectURL(blob);
                    let imageId = document.getElementById(imageName);
                    imageId.src = imageURI;
                });
                return imageName;
            }
        };
    }
};
</script>

<style>
/* General card styling */
.message-card {
    padding-bottom: 10px;
    padding-top: 10px;
}
</style>
