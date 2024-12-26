<template>
    <q-item>
        <q-item-section top>
            <div class="text-h6">
                {{ t('settings.title') }}
            </div>
        </q-item-section>
        <q-item-section side avatar>
            <q-file ref="avatarPicker" v-model="avatarImage" @update:model-value="handleAvatarSelected()"
                accept=".png, .jpg, .jpeg, .svg" style="display:none" />

            <q-avatar size="xl" @click="handleAvatarPicker()">
                <q-img v-if="userAvatar" :src="userAvatar" @mouseover="showActionButton = true"
                    @mouseleave="showActionButton = false">
                    <q-btn class="absolute-bottom" size="sm" icon="mdi-swap-horizontal"
                        v-show="showActionButton" />
                </q-img>
                <q-icon v-else name="mdi-account-circle" size="xl" :color="iconColor"
                    @mouseover="showActionButton = true" @mouseleave="showActionButton = false">
                    <q-btn class="absolute-bottom" size="sm" icon="mdi-plus-circle" v-show="showActionButton" />
                </q-icon>
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.avatar.tooltip') }}
                </q-tooltip>
            </q-avatar>
        </q-item-section>
    </q-item>
</template>

<script>
import { computed, ref } from 'vue';
import { useSettingsStore } from '../../stores/settings-store.js';
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

export default {
    name: 'UserAvatarSettings',
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const settingsStore = useSettingsStore();
        const { userAvatar } = storeToRefs(settingsStore);

        const avatarImage = ref(null);
        const avatarPicker = ref(null);
        const showActionButton = ref(false);

        const handleAvatarPicker = () => {
            avatarPicker.value.pickFiles();
        }

        const handleAvatarSelected = () => {
            if (avatarImage.value) {
                const reader = new FileReader();
                reader.onload = () => userAvatar.value = reader.result;
                reader.readAsDataURL(avatarImage.value);
            }
        }

        return {
            t,
            userAvatar,
            avatarImage,
            avatarPicker,
            showActionButton,
            handleAvatarPicker,
            handleAvatarSelected,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>
