// Filler for textarea fields

(function(global) {
  'use strict';

  /**
   * Textarea Filler
   */
  class TextareaFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.TEXTAREA);
    }

    /**
     * Fill textarea field
     * @param {Object} field - Field object with value
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      if (!field.value) {
        this.logger.info(`Skipping empty value for: "${field.question}"`);
        return false;
      }

      let textarea = null;

      // Strategy 1: Find by aria-labelledby
      if (field.ariaLabelledBy) {
        textarea = document.querySelector(`textarea[aria-labelledby="${field.ariaLabelledBy}"]`);
      }

      // Strategy 2: Find by data-params
      if (!textarea && field.dataParams) {
        textarea = document.querySelector(`textarea[data-params="${field.dataParams}"]`);
      }

      // Strategy 3: Find by question text
      if (!textarea) {
        const allTextareas = document.querySelectorAll(SELECTORS.TEXTAREA);
        for (const elem of allTextareas) {
          const question = DOMUtils.getQuestionText(elem);
          if (question === field.question) {
            textarea = elem;
            break;
          }
        }
      }

      if (!textarea) {
        this.logFillResult(false, field.question);
        return false;
      }

      // Fill the textarea
      await EventUtils.setInputValue(textarea, field.value);
      
      this.logFillResult(true, field.question);
      return true;
    }
  }

  // Expose to global namespace
  global.TextareaFiller = TextareaFiller;

})(window);