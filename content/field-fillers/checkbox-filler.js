// Filler for standard checkbox fields (multiple selection - non-grid)

(function(global) {
  'use strict';

  /**
   * Checkbox Filler
   * Handles standard checkbox groups only
   */
  class CheckboxFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.CHECKBOX);
    }

    /**
     * Fill a standard checkbox field
     * @param {Object} field - Field object with value (array of options to check)
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      if (!field.value || !Array.isArray(field.value) || field.value.length === 0) {
        this.logger.info(`Skipping empty value for: "${field.question}"`);
        return false;
      }

      const listItem = this._findListItemByQuestion(field.question);

      if (!listItem) {
        this.logFillResult(false, field.question);
        return false;
      }

      const result = await this._fillCheckboxes(listItem, field.value);

      const success = result.checked > 0;
      this.logger.info(`Checkbox "${field.question}": ${result.checked}/${field.value.length} checked`);
      this.logFillResult(success, field.question);

      return success;
    }

    /**
     * Find list item by question text
     * @param {string} question - Question text to match
     * @returns {HTMLElement|null} - List item element or null
     * @private
     */
    _findListItemByQuestion(question) {
      const listItems = this.getAllListItems();

      for (const item of listItems) {
        const itemQuestion = DOMUtils.getQuestionText(item);
        if (itemQuestion === question) {
          return item;
        }
      }

      this.logger.warn(`List item not found for: "${question}"`);
      return null;
    }

    /**
     * Fill checkboxes in a list item
     * @param {HTMLElement} listItem - List item containing checkboxes
     * @param {Array<string>} valuesToCheck - Values to check
     * @returns {Promise<Object>} - Result { checked, failed }
     * @private
     */
    async _fillCheckboxes(listItem, valuesToCheck) {
      const checkboxes = this._findValidCheckboxes(listItem);
      let checked = 0;
      let failed = 0;

      for (const value of valuesToCheck) {
        const checkbox = this._findCheckboxByValue(checkboxes, value);

        if (!checkbox) {
          this.logger.warn(`Checkbox option not found: "${value}"`);
          failed++;
          continue;
        }

        const success = await this._clickCheckbox(checkbox);
        if (success) {
          checked++;
        } else {
          failed++;
        }
      }

      return { checked, failed };
    }

    /**
     * Find valid checkboxes in list item (exclude grid, disabled, other)
     * @param {HTMLElement} listItem - List item element
     * @returns {Array<HTMLElement>} - Array of valid checkbox elements
     * @private
     */
    _findValidCheckboxes(listItem) {
      const allCheckboxes = listItem.querySelectorAll('[role="checkbox"]');
      const validCheckboxes = [];

      for (const checkbox of allCheckboxes) {
        // Skip if inside grid container
        if (checkbox.closest('.gTGYUd') || checkbox.closest('.e12QUd')) {
          continue;
        }

        // Skip if disabled
        if (checkbox.getAttribute('aria-disabled') === 'true') {
          continue;
        }

        // Skip "other" option
        const answerValue = checkbox.getAttribute('data-answer-value');
        if (answerValue === '__other_option__') {
          continue;
        }

        validCheckboxes.push(checkbox);
      }

      return validCheckboxes;
    }

    /**
     * Find checkbox element by value
     * @param {Array<HTMLElement>} checkboxes - Checkbox elements
     * @param {string} value - Value to find
     * @returns {HTMLElement|null} - Matching checkbox or null
     * @private
     */
    _findCheckboxByValue(checkboxes, value) {
      const normalizedValue = this._normalizeText(value).toLowerCase();

      for (const checkbox of checkboxes) {
        // Check data-answer-value
        const answerValue = checkbox.getAttribute('data-answer-value');
        if (answerValue && this._normalizeText(answerValue).toLowerCase() === normalizedValue) {
          return checkbox;
        }

        // Check aria-label
        const ariaLabel = checkbox.getAttribute('aria-label');
        if (ariaLabel && this._normalizeText(ariaLabel).toLowerCase() === normalizedValue) {
          return checkbox;
        }
      }

      return null;
    }

    /**
     * Click a checkbox if not already checked
     * @param {HTMLElement} checkbox - Checkbox element to click
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _clickCheckbox(checkbox) {
      const isChecked = checkbox.getAttribute('aria-checked') === 'true';

      if (isChecked) {
        this.logger.info('Checkbox already checked');
        return true;
      }

      // Scroll into view
      if (typeof DOMUtils !== 'undefined' && DOMUtils.scrollIntoView) {
        DOMUtils.scrollIntoView(checkbox);
        await this.sleep(TIMING.SHORT_DELAY);
      }

      // Click the checkbox
      checkbox.click();
      await this.sleep(TIMING.MEDIUM_DELAY);

      // Verify
      const nowChecked = checkbox.getAttribute('aria-checked') === 'true';
      if (nowChecked) {
        return true;
      }

      // Retry: click parent label
      const label = checkbox.closest('label');
      if (label) {
        label.click();
        await this.sleep(TIMING.MEDIUM_DELAY);

        return checkbox.getAttribute('aria-checked') === 'true';
      }

      return false;
    }

    /**
     * Normalize text for matching
     * @param {string} text - Text to normalize
     * @returns {string} - Normalized text
     * @private
     */
    _normalizeText(text) {
      if (!text) return '';

      return text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/,\s*jawaban untuk.*$/i, '')
        .trim();
    }
  }

  // Expose to global namespace
  global.CheckboxFiller = CheckboxFiller;

})(window);