// Filler for text input fields

(function(global) {
  'use strict';

  /**
   * Text Input Filler
   */
  class TextFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.TEXT);
    }

    /**
     * Fill text input field
     * @param {Object} field - Field object with value
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      if (!field.value) {
        this.logger.info(`Skipping empty value for: "${field.question}"`);
        return false;
      }

      let input = null;

      const allInputs = document.querySelectorAll(SELECTORS.TEXT_INPUT);
      for (const elem of allInputs) {
        // Cek apakah input ini visible (untuk menghindari hidden fields yang mungkin tertinggal)
        if (!DOMUtils.isVisible(elem)) continue;

        const question = DOMUtils.getQuestionText(elem);
        
        // Exact Match
        if (question === field.question) {
          input = elem;
          break;
        }
      }

      if (!input) {
        this.logFillResult(false, field.question);
        return false;
      }

      // Fill the input
      await EventUtils.setInputValue(input, field.value);
      
      this.logFillResult(true, field.question);
      return true;
    }
  }

  // Expose to global namespace
  global.TextFiller = TextFiller;

})(window);