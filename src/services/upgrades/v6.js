import localforage from 'localforage';
import logger from '@/services/logger.js';

export async function upgradeToVersion6() {
    try {
        logger.log("[dbUpgrader][v6] - Starting image storage optimization");

        // Initialize databases with IndexedDB
        const teamsDB = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: 'TeamAI',
            storeName: 'teams'
        });

        const imageDB = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: 'TeamAI',
            storeName: 'images'
        });

        // Get messages to process
        let messagesJson = await teamsDB.getItem('messages');
        if (!messagesJson) {
            logger.log("[dbUpgrader][v6] - No messages found to upgrade");
            return;
        }

        let messages;
        try {
            messages = JSON.parse(messagesJson);
            if (!Array.isArray(messages)) {
                throw new Error("Messages data is not an array");
            }
        } catch (error) {
            logger.error(`[dbUpgrader][v6] - Invalid messages data: ${error.message}`);
            throw error;
        }

        if (messages.length === 0) {
            logger.log("[dbUpgrader][v6] - Messages array is empty");
            return;
        }

        logger.log(`[dbUpgrader][v6] - Processing ${messages.length} messages`);
        for (let m = 0; m < messages.length; m++) {
            const progressPercent = Math.round((m / messages.length) * 100);
            if (progressPercent % 10 === 0) {
                logger.log(`[dbUpgrader][v6] - Progress: ${progressPercent}%`);
            }
            logger.log(`[dbUpgrader][v6] - Processing message: ${messages[m].timestamp}`);

            if (messages[m].object == 'image' &&
                messages[m].hasOwnProperty('choices') &&
                messages[m].choices.length > 0) {

                // Process each image choice
                for (let i = 0; i < messages[m].choices.length; i++) {
                    const choice = messages[m].choices[i];
                    logger.log(`[dbUpgrader][v6] - Processing image in message ${messages[m].timestamp}, choice ${choice.index}`);

                    if (choice.content.startsWith('image')) {
                        // Handle existing image reference
                        try {
                            const image = await imageDB.getItem(choice.content);
                            if (image instanceof Blob) {
                                logger.log(`[dbUpgrader][v6] - Verified existing image: ${choice.content}`);
                            } else {
                                logger.warn(`[dbUpgrader][v6] - Invalid image data, removing reference: ${choice.content}`);
                                messages[m].choices.splice(i, 1);
                                i--; // Adjust index after removal
                            }
                        } catch (error) {
                            logger.error(`[dbUpgrader][v6] - Error checking image ${choice.content}: ${error.message}`);
                            messages[m].choices.splice(i, 1);
                            i--; // Adjust index after removal
                        }
                    } else if (choice.content.startsWith('data:image')) {
                        // Handle base64 image
                        const imageName = `image-${messages[m].timestamp}-${choice.index}`;
                        logger.log(`[dbUpgrader][v6] - Converting base64 image to blob: ${imageName}`);

                        try {
                            // Convert and store image
                            const response = await fetch(choice.content);
                            const blob = await response.blob();
                            
                            if (blob.size === 0) {
                                throw new Error("Empty image blob");
                            }

                            await imageDB.setItem(imageName, blob);
                            
                            // Verify storage
                            const testImage = await imageDB.getItem(imageName);
                            if (testImage instanceof Blob && testImage.size > 0) {
                                messages[m].choices[i] = {
                                    index: choice.index,
                                    content: imageName
                                };
                                logger.log(`[dbUpgrader][v6] - Successfully stored image: ${imageName}`);
                            } else {
                                throw new Error("Image verification failed");
                            }
                        } catch (error) {
                            logger.error(`[dbUpgrader][v6] - Failed to process image ${imageName}: ${error.message}`);
                            messages[m].choices.splice(i, 1);
                            i--; // Adjust index after removal
                        }
                    } else {
                        logger.warn(`[dbUpgrader][v6] - Invalid content format, removing: ${choice.content}`);
                        messages[m].choices.splice(i, 1);
                        i--; // Adjust index after removal
                    }
                }

                // Clean up empty choices arrays
                if (messages[m].choices.length === 0) {
                    logger.warn(`[dbUpgrader][v6] - Message ${messages[m].timestamp} has no valid images left`);
                }
            }
        }

        // Save updated messages
        try {
            const updatedJson = JSON.stringify(messages);
            await teamsDB.setItem('messages', updatedJson);
            
            // Verify save
            const verifyJson = await teamsDB.getItem('messages');
            if (verifyJson === updatedJson) {
                logger.log("[dbUpgrader][v6] - Successfully saved updated messages");
            } else {
                throw new Error("Message save verification failed");
            }
        } catch (error) {
            logger.error(`[dbUpgrader][v6] - Failed to save messages: ${error.message}`);
            throw error;
        }

        logger.log("[dbUpgrader][v6] - Image storage optimization completed successfully");
    } catch (error) {
        logger.error(`[dbUpgrader][v6] - Error: ${error.message}`);
        throw error;
    }
}
