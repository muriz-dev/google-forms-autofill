// Filler for single-selection radio button fields

(function(global) {
  'use strict';

  /**
   * Radio Button Filler
   * Handles single-selection radio groups only
   */
  class RadioFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.RADIO);
    }

    /**
     * Fill a single-selection radio button field
     * @param {Object} field - Field object with value to select
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      if (!field.value) {
        this.logger.info(`Skipping empty value for: "${field.question}"`);
        return false;
      }

      const targetGroup = this._findGroupByQuestion(field.question);
      
      if (!targetGroup) {
        this.logFillResult(false, field.question);
        return false;
      }

      const success = await this._selectOption(targetGroup, field.value, field.question);
      this.logFillResult(success, field.question);
      return success;
    }

    /**
     * Find radio group by question text
     * @param {string} question - Question text to match
     * @returns {HTMLElement|null} - Radio group element or null
     * @private
     */
    _findGroupByQuestion(question) {
      const radioGroups = document.querySelectorAll(SELECTORS.RADIO_GROUP);

      for (const group of radioGroups) {
        const groupQuestion = DOMUtils.getQuestionText(group);
        if (groupQuestion === question) {
          return group;
        }
      }

      this.logger.warn(`Radio group not found for: "${question}"`);
      return null;
    }

    /**
     * Select an option within a radio group
     * @param {HTMLElement} group - Radio group element
     * @param {string} value - Option value to select
     * @param {string} question - Question text (for logging)
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _selectOption(group, value, question) {
      const radios = group.querySelectorAll(SELECTORS.RADIO);

      for (const radio of radios) {
        const label = radio.getAttribute('aria-label') || radio.innerText.trim();

        if (label === value) {
          return await this._clickRadio(radio);
        }
      }

      this.logger.warn(`Option "${value}" not found in: "${question}"`);
      return false;
    }

    /**
     * Click a radio button if not already selected
     * @param {HTMLElement} radio - Radio element to click
     * @returns {Promise<boolean>} - Always returns true after clicking
     * @private
     */
    async _clickRadio(radio) {
      const isSelected = radio.getAttribute('aria-checked') === 'true';

      if (!isSelected) {
        radio.click();
        await this.sleep(TIMING.MEDIUM_DELAY);
      }

      return true;
    }
  }

  // Expose to global namespace
  global.RadioFiller = RadioFiller;

})(window);