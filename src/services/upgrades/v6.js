import { imageDB, teamsDB } from '@/services/localforage.js';
import logger from '@/services/logger.js';

export async function upgradeToVersion6() {
    try {
        let messages = JSON.parse(await teamsDB.getItem('messages'));
        if (messages == null) {
            logger.error(`[dbUpgrader][v6] - Nothing to upgrade`);
            return;
        }

        for (let m = 0; m < messages.length; m++) {
            logger.log(`[dbUpgrader][v6] - Processing message: ${messages[m].timestamp}`);

            if (messages[m].object == 'image' &&
                messages[m].hasOwnProperty('choices') &&
                messages[m].choices.length > 0) {

                for (let i = 0; i < messages[m].choices.length; i++) {
                    logger.log(`[dbUpgrader][v6] - [v6]:\tProcessing image: ${messages[m].choices[i].index}`);
                    if (messages[m].choices[i].content.startsWith('image')) {
                        logger.log(`[dbUpgrader][v6] - \t\tImage name: ${messages[m].choices[i].content}`);
                        const image = await imageDB.getItem(messages[m].choices[i].content);
                        if (image != null) {
                            logger.log("[dbUpgrader][v6] - \t\tImage exists in imageDB.")
                        } else {
                            logger.log("[dbUpgrader][v6] - \t\tImage does not exist in imageDB. Removing reference from message.")
                            messages[m].choices.splice(i, 1);
                        }
                    } else if (messages[m].choices[i].content.startsWith('data:image')) {
                        let imageName = `image-${messages[m].timestamp}-${messages[m].choices[i].index}`;
                        logger.log(`[dbUpgrader][v6] - \t\tFound base64 image. Moving to imageDB with imageName: ${imageName}`);

                        try {
                            let response = await fetch(messages[m].choices[i].content);
                            let blob = await response.blob();
                            await imageDB.setItem(imageName, blob);

                            const testImage = await imageDB.getItem(imageName);
                            if (testImage != null) {
                                const newItem = { index: messages[m].choices[i].index, content: imageName };
                                messages[m].choices.splice(i, 1, newItem);
                            } else {
                                throw new Error("[dbUpgrader][v6] - Error when moving image: " + imageName);
                            }
                        } catch (error) {
                            logger.error(`[dbUpgrader][v6] - Store image error: ${error.message}`);
                            throw error;
                        }
                    } else {
                        logger.log(`[dbUpgrader][v6] - \t\tUnexpected image reference. Removing from message. ${messages[m].choices[i].content}`)
                    }
                }
            } else {
                logger.log(`[dbUpgrader][v6] - \tNo images in message. ${messages[m].timestamp}`);
            }
        }

        await teamsDB.setItem('messages', JSON.stringify(messages));

        let testMessages = await teamsDB.getItem('messages');
        if (testMessages != null && testMessages == JSON.stringify(messages)) {
            logger.log(`[dbUpgrader][v6] - Messages upgrade completed successfully.`);
        } else {
            logger.error(`[dbUpgrader][v6] - Error when upgrading messages.`);
            throw new Error("Error when upgrading messages.");
        }
    } catch (error) {
        logger.error(`[dbUpgrader][v6] - Error: ${error.message}`);
        throw error;
    }
}
