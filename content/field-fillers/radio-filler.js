// Filler for single-selection radio button fields
(function(global) {
  'use strict';

  /**
   * Radio Button Filler
   * Handles single-selection radio groups (including rating inputs)
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

      const success = await this._selectOption(
        targetGroup,
        field.value,
        field.question
      );

      this.logFillResult(success, field.question);
      return success;
    }

    /**
     * Find radio group by question text
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
     */
    async _selectOption(group, value, question) {
      const radios = group.querySelectorAll(SELECTORS.RADIO);

      for (const radio of radios) {
        const label =
          radio.getAttribute('aria-label') ||
          radio.innerText.trim();

        if (label === value) {
          await this._forceClickRadio(radio);
          return true;
        }
      }

      this.logger.warn(`Option "${value}" not found in: "${question}"`);
      return false;
    }

    /**
     * Force-click a radio / rating option
     */
    async _forceClickRadio(radio) {
      const events = ['mousedown', 'mouseup', 'click'];

      for (const type of events) {
        radio.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window
          })
        );
      }

      await this.sleep(TIMING.MEDIUM_DELAY);
      return true;
    }
  }

  // Expose to global namespace
  global.RadioFiller = RadioFiller;

})(window);