// Base class for field fillers

(function(global) {
  'use strict';

  /**
   * Base Filler Class
   * All field fillers inherit from this
   */
  class BaseFiller {
    constructor(fieldType) {
      this.fieldType = fieldType;
      this.logger = createLogger(`Filler:${fieldType}`);
    }

    /**
     * Fill field with provided data
     * Must be implemented by child classes
     * @param {Object} field - Field object with value to fill
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      throw new Error('fill() must be implemented by child class');
    }

    /**
     * Find element by question text
     * @param {string} questionText - Question to search for
     * @param {string} selector - CSS selector for element type
     * @returns {HTMLElement|null} - Found element or null
     */
    findElementByQuestion(questionText, selector) {
      return DOMUtils.findElementByQuestion(questionText, selector);
    }

    /**
     * Get all list items
     * @returns {NodeList} - List items
     */
    getAllListItems() {
      return DOMUtils.getAllListItems();
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    async sleep(ms) {
      return EventUtils.sleep(ms);
    }

    /**
     * Log fill result
     * @param {boolean} success - Fill success status
     * @param {string} question - Field question
     */
    logFillResult(success, question) {
      if (success) {
        this.logger.success(`Filled: "${question}"`);
      } else {
        this.logger.warn(`Failed to fill: "${question}"`);
      }
    }
  }

  // Expose to global namespace
  global.BaseFiller = BaseFiller;

})(window);