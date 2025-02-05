import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings-store';
import { useTeamsStore } from '@/stores/teams-store';
import iCloudService from '@/services/iCloudService';
import { createBaseHandler } from '../createBaseHandler';
import { withLogging } from '../middleware/logging';
import { withValidation } from '../middleware/validation';
import logger from '@/services/logger';

export const createPersonasHandler = () => {
    const settingsStore = useSettingsStore();
    const teamsStore = useTeamsStore();
    const { syncOptions } = storeToRefs(settingsStore);
    const { personas } = storeToRefs(teamsStore);

    // Create base implementation
    const handler = createBaseHandler({
        enabled: () => syncOptions.value.personas,

        sync: async (itemId, data, changeType) => {
            logger.debug('[CloudSync:Personas] Syncing persona:', {
                id: itemId,
                changeType,
                hasData: !!data
            });
            return iCloudService.syncPersona(itemId, data, changeType);
        },

        getChanges: async (since) => {
            return iCloudService.getChangedPersonas(since);
        },

        applyChange: (item) => {
            if (!item.data || !item.itemId) {
                logger.error('[CloudSync:Personas] Invalid persona data from cloud:', item);
                return;
            }

            const personaData = {
                id: item.itemId,
                name: item.data.name,
                prompt: item.data.prompt,
                avatar: item.data.avatar,
                readonly: item.data.readonly || false,
                lastModified: item.data.lastModified || Date.now()
            };

            if (teamsStore.validatePersona(personaData)) {
                const existing = personas.value.findIndex(p => p.id === item.itemId);
                if (existing >= 0) {
                    personas.value[existing] = personaData;
                } else {
                    personas.value.push(personaData);
                }
            } else {
                logger.error('[CloudSync:Personas] Invalid persona data structure:', personaData);
            }
        }
    });

    // Enhance with middleware
    return withLogging(withValidation(handler, 'personas'));
};
