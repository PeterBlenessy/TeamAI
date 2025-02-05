import { storeToRefs } from 'pinia';
import { useSettingsStore } from '@/stores/settings-store';
import { useTeamsStore } from '@/stores/teams-store';
import iCloudService from '@/services/iCloudService';
import { createBaseHandler } from '../createBaseHandler';
import { withLogging } from '../middleware/logging';
import { withValidation } from '../middleware/validation';
import logger from '@/services/logger';

export const createConversationsHandler = () => {
    const settingsStore = useSettingsStore();
    const teamsStore = useTeamsStore();
    const { syncOptions } = storeToRefs(settingsStore);
    const { history, messages } = storeToRefs(teamsStore);

    // Create base implementation
    const handler = createBaseHandler({
        enabled: () => syncOptions.value.conversations,

        sync: async (itemId, data, changeType) => {
            logger.debug('[CloudSync:Conversations] Syncing conversation:', {
                id: itemId,
                changeType,
                messageCount: data?.messages?.length
            });
            return iCloudService.syncConversation(itemId, data, changeType);
        },

        getChanges: async (since) => {
            return iCloudService.getChangedConversations(since);
        },

        applyChange: (item) => {
            // Initialize arrays if needed
            if (!Array.isArray(history.value)) {
                history.value = [];
            }
            if (!Array.isArray(messages.value)) {
                messages.value = [];
            }

            try {
                // Update history entry
                const historyIndex = history.value.findIndex(c => c.conversationId === item.itemId);
                if (historyIndex >= 0) {
                    history.value[historyIndex] = {
                        ...item.data.history,
                        conversationId: item.itemId
                    };
                } else {
                    history.value.push({
                        ...item.data.history,
                        conversationId: item.itemId
                    });
                }

                // Update messages
                // First remove any existing messages for this conversation
                const otherMessages = messages.value.filter(m => 
                    m && typeof m === 'object' && m.conversationId !== item.itemId
                );

                // Then add the synced messages
                messages.value = [
                    ...otherMessages,
                    ...(item.data.messages || []).map(msg => ({
                        ...msg,
                        conversationId: item.itemId
                    }))
                ];

                logger.debug('[CloudSync:Conversations] Updated conversation:', {
                    id: item.itemId,
                    historyIndex,
                    messageCount: item.data.messages?.length || 0
                });
            } catch (error) {
                logger.error('[CloudSync:Conversations] Error applying conversation change:', {
                    id: item.itemId,
                    error: String(error),
                    stack: error?.stack
                });
            }
        }
    });

    // Enhance with middleware
    return withLogging(withValidation(handler, 'conversations'));
};
