// Filler for single-selection radio button fields
(function (global) {
  'use strict';

  function getCheckedRadio(group) {
    return group.querySelector(
      '[role="radio"][aria-checked="true"]'
    );
  }

  /**
   * Check whether this radio group is a Google Forms rating
   */
  function isGoogleFormsRating(group) {
    return group.querySelector('[data-ratingscale]') !== null;
  }

  /**
   * Get current rating value from Google Forms rating component
   */
  function getCurrentGoogleFormsRating(group) {
    return group.querySelectorAll(
      '[role="radio"][aria-checked="true"]'
    ).length;
  }

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

      // Google Forms rating
      if (isGoogleFormsRating(group)) {
        const currentRating = getCurrentGoogleFormsRating(group);

        if (Number(value) === currentRating) {
          this.logger.info(
            `Skipping rating "${question}" because value unchanged (${value})`
          );
          return true;
        }
      }
      // Normal radio (single selection)
      else {
        const checkedRadio = getCheckedRadio(group);

        if (checkedRadio) {
          const checkedValue =
            checkedRadio.getAttribute('data-value') ||
            checkedRadio.getAttribute('aria-label') ||
            checkedRadio.innerText.trim();

          if (String(checkedValue) === String(value)) {
            this.logger.info(
              `Skipping radio "${question}" because value unchanged (${value})`
            );
            return true;
          }
        }
      }

      // Perform click if value is different
      for (const radio of radios) {
        const label =
          radio.getAttribute('data-value') ||
          radio.getAttribute('aria-label') ||
          radio.innerText.trim();

        if (String(label) === String(value)) {
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