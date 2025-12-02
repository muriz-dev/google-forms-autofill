// Centralized Chrome Storage API wrapper

(function(global) {
  'use strict';

  const StorageHelper = {
    /**
     * Get data from Chrome Storage
     * @param {string} key - Storage key
     * @returns {Promise<any>} - Stored value or null
     */
    async get(key) {
      try {
        const result = await chrome.storage.local.get([key]);
        return result[key] || null;
      } catch (error) {
        console.error(`[Storage] Error getting ${key}:`, error);
        return null;
      }
    },

    /**
     * Set data in Chrome Storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {Promise<boolean>} - Success status
     */
    async set(key, value) {
      try {
        await chrome.storage.local.set({ [key]: value });
        return true;
      } catch (error) {
        console.error(`[Storage] Error setting ${key}:`, error);
        return false;
      }
    },

    /**
     * Remove data from Chrome Storage
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} - Success status
     */
    async remove(key) {
      try {
        await chrome.storage.local.remove([key]);
        return true;
      } catch (error) {
        console.error(`[Storage] Error removing ${key}:`, error);
        return false;
      }
    },

    /**
     * Clear all data from Chrome Storage
     * @returns {Promise<boolean>} - Success status
     */
    async clear() {
      try {
        await chrome.storage.local.clear();
        return true;
      } catch (error) {
        console.error('[Storage] Error clearing storage:', error);
        return false;
      }
    },

    /**
     * Get all keys from Chrome Storage
     * @returns {Promise<string[]>} - Array of keys
     */
    async getAllKeys() {
      try {
        const result = await chrome.storage.local.get(null);
        return Object.keys(result);
      } catch (error) {
        console.error('[Storage] Error getting all keys:', error);
        return [];
      }
    }
  };

  // Expose to global namespace
  global.StorageHelper = StorageHelper;

})(window);