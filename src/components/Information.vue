<template>
    <q-card>
        <q-card-section>
            <div class="text-h6">
                {{ t('info.title') }}
            </div>
            {{ t('info.content') }}
        </q-card-section>
    </q-card>
</template>

<script>

import { useI18n } from 'vue-i18n';

export default {
    name: 'Information',
    setup() {
        const { t } = useI18n();

        return {
            t
        }
    }
}
</script>

<style></style>
