import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useTeamsStore } from '../stores/teams-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';
import { imageDB } from '../services/localforage.js';

const databaseUpgrader = () => {

    const { t } = useI18n();
    const $q = useQuasar();

    const teamsStore = useTeamsStore();
    const { images, messages } = storeToRefs(teamsStore);

    const settingsStore = useSettingsStore();
    const { dBVersion } = storeToRefs(settingsStore);

    const dBVersions = [
        {
            version: '1',
            description: 'Optimized database structure by moving images from messages to separate table.',
            caption: t('databaseUpgrade.inProgress.caption', { version: '1' }),
            upgrade: () => upgradeToVersion1()
        }
    ];

    // =================================================================================================
    // Update latest database version here when needed
    // -------------------------------------------------------------------------------------------------
    const LATEST_DB_VERSION = '1';
    // =================================================================================================

    const isUpgradeNeed = () => dBVersion.value == LATEST_DB_VERSION ? false : true;

    // Upgrade to version 1
    const upgradeToVersion1 = async () => {
        messages.value.forEach((message, index) => {
            if (message.object == 'image' &&
                message.hasOwnProperty('choices') &&
                message.choices.length > 0) {

                console.log(index, message.conversationId, message.role, message.object, message.choices.length);
                console.log(message.choices);

                message.choices.forEach(async (image, index) => {
                    if (image.content.startsWith('image')) {
                        // All good, do nothing
                        // todo: Check if message should exist, i.e. that conversation still  exists
                        return;
                    }

                    if (image.content.startsWith('data:image')) {
                        // Found base64 image, move to imageDB
                        try {
                            let imageName = 'image' + '-' + message.timestamp + '-' + image.index;
                            console.log('Found base64 image. Moving to imageDB with imageName: ', imageName);

                            // Create blob from base64 image and store it in imageDB
                            let response = await fetch(imageB64);
                            let blob = await response.blob();
                            await imageDB.setItem(imageName, blob);

                            let imageURI = URL.createObjectURL(blob);

                            // todo: Generate image thumbnail
                            let thumbnailURI = ''; //URL.createObjectURL(thumbnailBlob)

                            // Store image URIs
                            images.value.push({ imageName, imageURI, thumbnailURI });

                            // Update message
                            image.content = imageName;
                        } catch (error) {
                            console.error(error);
                            throw error;
                        }
                    }
                });
            }
        });
    }
    // Upgrade database
    const upgrade = () => {
        const upgradeDialog = $q.notify({
            group: false, // required to be updatable
            timeout: 0,   // we want to be in control when it gets dismissed
            spinner: true,
            position: 'center',
            message: t('databaseUpgrade.needed.message')
        });

        let dBUpgrades = dBVersions.filter(version => version.version > dBVersion.value);
        let progress = 0;
        let nbrUpgrades = dBUpgrades.length;

        try {
            // Execute the needed upgrades
            dBUpgrades.forEach(async (version) => {
                console.log('Upgrading database to version: ', version.version);
                upgradeDialog({ caption: `${progress++} of ${nbrUpgrades}` });
                try {
                    await version.upgrade();
                    dBVersion.value = version.version;
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            });
 
            // All upgrades are done
            upgradeDialog({
                icon: 'mdi-check',
                spinner: false,
                message: t('databaseUpgrade.completed.message'),
                caption: t('databaseUpgrade.completed.caption'),
                timeout: 5000,
                actions: [{ label: t('databaseUpgrade.completed.action'), handler: () => { } }]
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // Public functions
    return {
        isUpgradeNeed,
        upgrade
    }
}

export default databaseUpgrader;