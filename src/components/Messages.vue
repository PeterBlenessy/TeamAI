<template>
    <div v-for="message in filteredMessages" :key="message.timestamp" scroll>
        <q-card flat square :class="'message-card ' + getBgColor(message.role)">
            <q-item top dense>

                <!-- Message avatar -->
                <q-item-section avatar top>
                    <q-icon rounded size="md" :name="message.role == 'user' ? 'account_box' : 'computer'"
                        :color="iconColor" />
                </q-item-section>

                <!-- Message content -->
                <q-item-section top>
                    <!-- Is 'choices' a key in message object. Images are stored in choices: [{ index, content }] -->
                    <div v-if="hasChoices(message) && message.object == 'image'">
                        <div class="q-pa-md">
                            <div class="q-col-gutter-md row justify-center items-start">
                                <!-- Iterate thwough the image choices -->
                                <div v-for="(item) in message.choices">
                                    <div class="col-6 ">
                                        <q-card flat square :class="$q.dark.isActive ? 'bg-grey-10' : 'bg-grey-4'">
                                            <q-card-section horizontal>
                                                <!-- Display image -->
                                                <q-img :src="item.content" width="400px" loading="lazy" draggable />

                                                <!-- Image actions -->
                                                <q-card-actions vertical class="justify-around">
                                                    <q-btn v-if="canShare(item, message.object)" size="sm" flat dense round
                                                        icon="mdi-export-variant" :color="iconColor"
                                                        @click="shareMessage(item, message.object)">
                                                        <q-tooltip :delay="750" transition-show="scale"
                                                            transition-hide="scale">
                                                            {{ $t("messages.tooltip.share") }}
                                                        </q-tooltip>
                                                    </q-btn>
                                                    <q-btn size="sm" flat dense round icon="mdi-delete-outline"
                                                        :color="iconColor"
                                                        @click="deleteChoice(message.timestamp, item.index)">
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

                                <q-btn v-if="canShare(message)" size="sm" flat dense icon="mdi-export-variant"
                                    :color="iconColor" @click="shareMessage(message)">
                                    <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                        {{ $t("messages.tooltip.share") }}
                                    </q-tooltip>
                                </q-btn>

                                <q-btn size="sm" flat dense icon="mdi-delete-outline" :color="iconColor"
                                    @click="deleteMessage(message.timestamp)">
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
                                        <q-spinner-bars @click.stop="stopSpeech(message)" color="primary"/>
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

export default {
    name: "Messages",
    components: {
        QMarkdown,
    },
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const teamsStore = useTeamsStore();
        const { loading, conversationId, messages } = storeToRefs(teamsStore);
        const settingsStore = useSettingsStore();
        const { chatDirection, speechLanguage } = storeToRefs(settingsStore);

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
                // For each key in settings, set the corresponding store value
                Object.keys(settings).forEach((key) => {
                    settingsStore[key] = settings[key];
                });
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
                const { getScrollTarget, setVerticalScrollPosition } = scroll;

                const page = document.getElementById("page");
                const target = getScrollTarget(page);
                const offset = chatDirection.value == "up" ? page.offsetHeight : 0;
                setVerticalScrollPosition(target, offset, 100);
            },
            { flush: "post" }
        );

        // Check if message has 'choices' key, used to store array of generated images
        const hasChoices = (message) => message.hasOwnProperty('choices');

        // Return message content or first item in 'choices' array, if present
        // todo: include all image choices when sharing?
        const getContent = async (message, type = 'text') => {
            let content = hasChoices(message) ? message.choices[0].content : message.content;

            if (type == 'image' || message.object == 'image') {
                const res = await fetch(content);
                const blob = await res.blob();
                const imageFile = new File([blob], 'Image.png', { type: blob.type });

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
            } catch (err) {
                console.log(err);
            }
        };

        // Check if message content can be shared via 'navigator.share'
        const canShare = async (message, type = 'text') => {
            return navigator.canShare(
                message.object == 'image' || type == 'image'
                    ? { files: [await getContent(message, 'image')] }
                    : { text: await getContent(message) }
            );
        };

        // Share message content via 'navigator.share', the native sharing mechanism
        const shareMessage = async (message, type = 'text') => {
            try {
                await navigator.share(
                    message.object == 'image' || type == 'image'
                        ? { files: [await getContent(message, 'image')] }
                        : { text: await getContent(message) }
                );
            } catch (err) {
                console.log(err);
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
            canShare,
            shareMessage,
            deleteMessage: (timestamp) => teamsStore.deleteMessage(timestamp),
            deleteChoice: (timestamp, index) => teamsStore.deleteChoice(timestamp, index),
            showMessageInfo,
            startSpeech,
            stopSpeech,
            readingMessage,
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
