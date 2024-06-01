<template>
    <q-list>
        <q-item v-if="false">
            <q-item-section avatar>
                <q-icon name="mdi-image-multiple-outline" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label caption>{{ t('settings.image.choices.label') }} ({{ choices
                    }})</q-item-label>
                <q-slider :model-value="choices" @change="val => { choices = val }" snap :min="1" :max="10" :step="1"
                    :markers="1" label />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.image.choices.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon name="mdi-image-size-select-large" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label caption>{{ t('settings.image.size.label') }} ({{ imageSize
                    }})</q-item-label>
                <q-slider :model-value="imageSizeValue" @update:model-value="val => { imageSizeValue = val }" snap
                    :min="0" :max="2" :step="1" :markers="1" label :label-value="imageSize" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.image.size.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon :name="imageQuality == 'hd' ? 'mdi-high-definition' : 'mdi-standard-definition'"
                    :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label caption>{{ t('settings.image.quality.label') }} ({{ imageQuality
                    }})</q-item-label>
                <q-slider :model-value="imageQualityValue" @update:model-value="val => { imageQualityValue = val }" snap
                    :min="0" :max="1" :step="1" :markers="1" label :label-value="imageQuality" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.image.quality.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

        <q-item>
            <q-item-section avatar>
                <q-icon name="mdi-palette" :color="iconColor" />
            </q-item-section>
            <q-item-section>
                <q-item-label caption>{{ t('settings.image.style.label') }} ({{ imageStyle
                    }})</q-item-label>
                <q-slider :model-value="imageStyleValue" @update:model-value="val => { imageStyleValue = val }" snap
                    :min="0" :max="1" :step="1" :markers="1" label :label-value="imageStyle" />
                <q-tooltip :delay="750" max-width="300px" transition-show="scale" transition-hide="scale">
                    {{ t('settings.image.style.tooltip') }}
                </q-tooltip>
            </q-item-section>
        </q-item>

    </q-list>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from "pinia";
import { useSettingsStore } from '../stores/settings-store.js';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import openaiConfig from '../services/openai.config.json';

export default {
    setup() {
        const $q = useQuasar();
        const { t } = useI18n();
        const settingsStore = useSettingsStore();
        const {
            appMode,
            imageSize, 
            imageQuality,
            imageStyle
        } = storeToRefs(settingsStore);

        // Load OpenAI API format parameters
        const imageSizeOptions = openaiConfig.imageSizeOptions;
        const imageQualityOptions = openaiConfig.imageQualityOptions;
        const imageStyleOptions = openaiConfig.imageStyleOptions;

        const imageSizeValue = ref(imageSizeOptions.indexOf(imageSize.value));
        const imageQualityValue = ref(imageQualityOptions.indexOf(imageQuality.value));
        const imageStyleValue = ref(imageStyleOptions.indexOf(imageStyle.value));

        watch(imageSizeValue, () => {
            imageSize.value = imageSizeOptions[imageSizeValue.value];
        });

        watch(imageQualityValue, () => {
            imageQuality.value = imageQualityOptions[imageQualityValue.value];
        });

        watch(imageStyleValue, () => {
            imageStyle.value = imageStyleOptions[imageStyleValue.value];
        });

        return {
            t,
            appMode,

            imageSize,
            imageSizeValue,
            imageQuality,
            imageQualityValue,
            imageStyle,
            imageStyleValue,

            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style scoped>
/* Your existing styles here */
</style>