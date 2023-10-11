import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useTeamsStore } from '../stores/teams-store.js';
import { useSettingsStore } from '../stores/settings-store.js';
import { storeToRefs } from 'pinia';
import { imageDB, settingsDB } from '../services/localforage.js';

const databaseUpgrader = () => {

    const { t } = useI18n();
    const $q = useQuasar();

    const teamsStore = useTeamsStore();
    const { images, messages } = storeToRefs(teamsStore);

    const dBVersions = [
        {
            version: 1,
            description: 'First database version',
            caption: t('databaseUpgrade.inProgress.caption', { version: '1' }),
            upgrade: () => {}
        },
        {
            version: 2,
            description: 'Optimized database structure by moving images from messages to separate table.',
            caption: t('databaseUpgrade.inProgress.caption', { version: '2' }),
            upgrade: () => upgradeToVersion2()
        }

    ];
    
    // =================================================================================================
    // Update latest database version here when needed
    // -------------------------------------------------------------------------------------------------
    const LATEST_DB_VERSION = 2;
    // =================================================================================================

    const getDBVersion = async () => parseInt(JSON.parse(await settingsDB.getItem('dBVersion')));
    const setDBVersion = async (version) => await settingsDB.setItem('dBVersion', JSON.stringify(version));

    const isUpgradeNeed = async () => {
        const currentVersion = await getDBVersion();
        return currentVersion < LATEST_DB_VERSION ? true : false;
    }

    // Upgrade to version 2
    const upgradeToVersion2 = () => {
        messages.value.forEach((message, index) => {
            if (message.object == 'image' &&
                message.hasOwnProperty('choices') &&
                message.choices.length > 0) {

                message.choices.forEach(async (item, index) => {
                    if (item.content.startsWith('image')) {
                        // All good, do nothing
                        return;
                    }

                    if (item.content.startsWith('data:image')) {
                        // Found base64 image, move to imageDB
                        try {
                            let imageName = 'image' + '-' + message.timestamp + '-' + item.index;
                            console.log('Found base64 image. Moving to imageDB with imageName: ', imageName);

                            // Create blob from base64 image and store it in imageDB
                            let response = await fetch(item.content);
                            let blob = await response.blob();
                            await imageDB.setItem(imageName, blob);

                            let imageURI = URL.createObjectURL(blob);

                            // todo: Generate image thumbnail
                            let thumbnailURI = ''; //URL.createObjectURL(thumbnailBlob)

                            // Store image URIs
                            images.value.push({ imageName, imageURI, thumbnailURI });

                            // Update message
                            item.content = imageName;
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

        let dBUpgrades = dBVersions.filter(version => version.version > getDBVersion());
        let progress = 0;
        let nbrUpgrades = dBUpgrades.length;

        try {
            // Execute the needed upgrades
            dBUpgrades.forEach(async (version) => {
                console.log('Upgrading database to version: ', version.version);
                upgradeDialog({ caption: `${progress++} of ${nbrUpgrades}` });
                try {
                    version.upgrade();
                    await setDBVersion(version.version);
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
                caption: t('databaseUpgrade.completed.caption', { version: getDBVersion() }),
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