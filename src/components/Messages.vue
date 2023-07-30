<template>
    <div v-for="message in filteredMessages" :key="message.timestamp" scroll>
        <q-card flat square :class="'message-card ' + getBgColor(message.role)">
            <q-item top dense>
                <q-item-section avatar top>
                    <q-icon rounded size="md" :name="message.role == 'user' ? 'account_box' : 'computer'"
                        :color="iconColor" />
                </q-item-section>

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
                                                <q-img :src="item.content" width="400px" loading="lazy" draggable/>

                                                <!-- Image actions -->
                                                <q-card-actions vertical class="justify-around">
                                                    <q-btn v-if="canShare(item)" size="sm" flat dense round
                                                        icon="mdi-export-variant" :color="iconColor"
                                                        @click="shareMessage(item)">
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

                <q-item-section side top>
                    <div class="q-gutter-xs">
                        <q-btn size="sm" flat dense icon="mdi-content-copy" :color="iconColor"
                            @click="copyMessage(message)">
                            <q-tooltip :delay="750" transition-show="scale" transition-hide="scale">
                                {{ $t("messages.tooltip.copy") }}
                            </q-tooltip>
                        </q-btn>

                        <q-btn v-if="canShare(message)" size="sm" flat dense icon="mdi-export-variant" :color="iconColor"
                            @click="shareMessage(message)">
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
export default {
    name: "Messages",
    components: {
        QMarkdown,
    },
    setup() {
        const $q = useQuasar();
        const teamsStore = useTeamsStore();
        const { loading, conversationId, messages } = storeToRefs(teamsStore);
        const settingsStore = useSettingsStore();
        const { chatDirection } = storeToRefs(settingsStore);

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

        // Load messages from conversationId
        watch(conversationId, () => filteredMessages);

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

        // Return message content or first item in 'choices' array, if present
        const getContent = (message) => message.hasOwnProperty('choices') ? message.choices[0].content : message.content;

        // Check if message has 'choices' key, used to store array of generated images
        const hasChoices = (message) => message.hasOwnProperty('choices');

        // Share message content via 'navigator.share', the native sharing mechanism
        const shareMessage = async (message) => {
            try {
                await navigator.share({ text: getContent(message) });
            } catch (err) {
                console.log(err);
            }
        };

        return {
            slide: ref(0),
            chatDirection,
            filteredMessages,
            getBgColor,
            iconColor: computed(() => ($q.dark.isActive ? "grey-4" : "grey-8")),
            loading,
            mdPlugins: [],
            hasChoices,
            copyMessage: (message) => navigator.clipboard.writeText(getContent(message)),
            deleteMessage: (timestamp) => teamsStore.deleteMessage(timestamp),
            canShare: (message) => navigator.canShare({ text: getContent(message) }),
            shareMessage,
            deleteChoice: (timestamp, index) => teamsStore.deleteChoice(timestamp, index)
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
