import { teamsDB } from '@/services/localforage.js';
import logger from '@/services/logger.js';

export async function upgradeToVersion10() {
    try {
        logger.log("[dbUpgrader][v10] - Starting message tracking upgrade");
        
        // Get conversations from history
        const historyJson = await teamsDB.getItem('history');
        if (!historyJson) {
            logger.log("[dbUpgrader][v10] - No history found, nothing to upgrade");
            return;
        }
        
        const history = JSON.parse(historyJson);
        const messagesJson = await teamsDB.getItem('messages');
        const messages = messagesJson ? JSON.parse(messagesJson) : [];

        // Update each conversation with message tracking
        const updatedHistory = history.map(conv => {
            if (!conv.messageLog) {
                // Count existing messages for this conversation
                const conversationMessages = messages.filter(
                    m => m.conversationId === conv.conversationId
                );

                conv.messageLog = {
                    added: [],
                    deleted: [],
                    lastSyncedMessageCount: conversationMessages.length
                };
                logger.log(`[dbUpgrader][v10] - Added message tracking to conversation ${conv.conversationId} with ${conversationMessages.length} messages`);
            }
            return conv;
        });

        // Store updated history
        await teamsDB.setItem('history', JSON.stringify(updatedHistory));
        
        // Verify upgrade
        const verifyJson = await teamsDB.getItem('history');
        if (verifyJson === JSON.stringify(updatedHistory)) {
            logger.log("[dbUpgrader][v10] - History upgrade completed successfully");
        } else {
            throw new Error("[dbUpgrader][v10] - History verification failed");
        }

    } catch (error) {
        logger.error(`[dbUpgrader][v10] - Error: ${error.message}`);
        throw error;
    }
}