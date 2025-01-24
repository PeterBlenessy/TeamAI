import logger from '@/services/logger.js';

const storage = {
    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            logger.error(`[localStorage] Error getting item ${key}: ${error}`);
            return null;
        }
    },

    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error(`[localStorage] Error setting item ${key}: ${error}`);
            return false;
        }
    },

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            logger.error(`[localStorage] Error removing item ${key}: ${error}`);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            logger.error(`[localStorage] Error clearing storage: ${error}`);
            return false;
        }
    }
};

export default storage;
