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

      // Strategy 1: Find by aria-labelledby
      if (field.ariaLabelledBy) {
        input = document.querySelector(`input[type="text"][aria-labelledby="${field.ariaLabelledBy}"]`);
      }

      // Strategy 2: Find by data-params
      if (!input && field.dataParams) {
        input = document.querySelector(`input[type="text"][data-params="${field.dataParams}"]`);
      }

      // Strategy 3: Find by question text
      if (!input) {
        const allInputs = document.querySelectorAll(SELECTORS.TEXT_INPUT);
        for (const elem of allInputs) {
          const question = DOMUtils.getQuestionText(elem);
          if (question === field.question) {
            input = elem;
            break;
          }
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