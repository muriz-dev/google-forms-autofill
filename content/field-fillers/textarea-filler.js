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
      
      const allTextareas = document.querySelectorAll(SELECTORS.TEXTAREA);
      for (const elem of allTextareas) {
        // Cek visibilitas
        if (!DOMUtils.isVisible(elem)) continue;

        const question = DOMUtils.getQuestionText(elem);
        
        if (question === field.question) {
          textarea = elem;
          break;
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