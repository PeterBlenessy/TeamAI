<template>
    <q-card style="min-width: 60%; max-width: 70%">
        <q-card-section>
            <div class="text-h6">
                {{ t('info.title') }}
            </div>
            {{ t('info.description') }}
        </q-card-section>

        <q-separator />

        <q-card-section>
            <q-list>

                <q-item>
                    <q-item-section>
                        <q-item-label label>{{ t('info.features.title') }}</q-item-label>
                        <q-item-label caption>{{ t('info.features.description') }}</q-item-label>

                        <div v-for="item in features" :key="item.label">

                            <q-item>
                                <q-item-section avatar>
                                    <q-icon rounded size="md" :name="item.icon" :color="iconColor" />
                                </q-item-section>
                                <q-item-section top>
                                    <q-item-label overline>{{ item.label }}</q-item-label>
                                    <q-item-label caption>{{ item.caption }}</q-item-label>
                                </q-item-section>
                            </q-item>

                        </div>

                    </q-item-section>
                </q-item>
                <q-separator inset spaced />

                <q-item>
                    <q-item-section>
                        <q-item-label label>{{ t('info.privacy.title') }}</q-item-label>
                        <q-item-label caption>{{ t('info.privacy.description') }}</q-item-label>
                    </q-item-section>
                </q-item>
                <q-separator inset spaced />

                <q-item>
                    <q-item-section>
                        <q-item-label label>{{ t('info.license.title') }}</q-item-label>
                        <q-item-label caption>{{ t('info.license.description') }}</q-item-label>
                    </q-item-section>
                </q-item>
                <q-separator inset spaced />

                <q-item>
                    <q-item-section>
                        <q-item-label label>{{ t('info.contact.title') }}</q-item-label>
                        <q-item-label caption>{{ t('info.contact.description') }}</q-item-label>
                    </q-item-section>
                </q-item>

            </q-list>
        </q-card-section>
    </q-card>
</template>

<script>

import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

export default {
    name: 'Information',
    setup() {
        const { t } = useI18n();
        const $q = useQuasar();

        const features = [
            {
                icon: 'mdi-account-outline',
                label: t('info.features.basic.label'),
                caption: t('info.features.basic.caption')
            },
            {
                icon: 'mdi-account-group-outline',
                label: t('info.features.advanced.label'),
                caption: t('info.features.advanced.caption')
            },
            {
                icon: 'mdi-tune',
                label: t('info.features.settings.label'),
                caption: t('info.features.settings.caption')
            },
            {
                icon: 'mdi-history',
                label: t('info.features.history.label'),
                caption: t('info.features.history.caption')
            },
            {
                icon: 'mdi-card-account-details-outline',
                label: t('info.features.personas.label'),
                caption: t('info.features.personas.caption')
            },
            {
                icon: 'mdi-account-arrow-down-outline',
                label: t('info.features.import.label'),
                caption: t('info.features.import.caption')
            }
        ];

        return {
            t,
            features,
            iconColor: computed(() => $q.dark.isActive ? 'grey-4' : 'grey-8')
        }
    }
}
</script>

<style></style>
