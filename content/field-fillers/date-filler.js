// Filler for date input fields

(function(global) {
  'use strict';

  /**
   * Date Field Filler
   * Handles filling date input fields in Google Forms
   * 
   * Supported value formats:
   * - ISO format: "2024-12-25" (YYYY-MM-DD)
   * - Slash format: "25/12/2024" (DD/MM/YYYY)
   * - Dash format: "25-12-2024" (DD-MM-YYYY)
   */
  class DateFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.DATE);
    }

    /**
     * Fill a date field
     * @param {Object} field - Field object with date value
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      if (!field.value) {
        this.logger.info(`Skipping empty value for: "${field.question}"`);
        return false;
      }

      // Normalize date value to ISO format (YYYY-MM-DD)
      const isoDate = this._normalizeToISO(field.value);
      
      if (!isoDate) {
        this.logger.warn(`Invalid date format for: "${field.question}", value: "${field.value}"`);
        this.logFillResult(false, field.question);
        return false;
      }

      const dateInput = this._findDateInput(field.question);

      if (!dateInput) {
        this.logFillResult(false, field.question);
        return false;
      }

      const success = await this._fillDateInput(dateInput, isoDate);
      this.logFillResult(success, field.question);
      
      return success;
    }

    /**
     * Normalize various date formats to ISO (YYYY-MM-DD)
     * @param {string} dateValue - Date value in various formats
     * @returns {string|null} - ISO formatted date or null if invalid
     * @private
     */
    _normalizeToISO(dateValue) {
      if (!dateValue) return null;

      const value = dateValue.trim();

      // Already ISO format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }

      // DD/MM/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        const parts = value.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }

      // DD-MM-YYYY format
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) {
        const parts = value.split('-');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }

      // MM/DD/YYYY format (US style)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        // Ambiguous with DD/MM/YYYY, assume DD/MM/YYYY for Indonesian locale
        const parts = value.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }

      // Try parsing as Date object
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch (e) {
        // Parsing failed
      }

      return null;
    }

    /**
     * Find date input by question text
     * @param {string} question - Question text to match
     * @returns {HTMLInputElement|null} - Date input element or null
     * @private
     */
    _findDateInput(question) {
      const dateControllers = document.querySelectorAll('[jscontroller="lLliLe"]');

      for (const controller of dateControllers) {
        const controllerQuestion = this._getQuestionText(controller);
        
        if (controllerQuestion === question) {
          const input = controller.querySelector('input[type="date"]');
          if (input) {
            return input;
          }
        }
      }

      this.logger.warn(`Date input not found for: "${question}"`);
      return null;
    }

    /**
     * Get question text from controller's parent
     * @param {HTMLElement} controller - Date controller element
     * @returns {string} - Question text
     * @private
     */
    _getQuestionText(controller) {
      const parent = controller.closest('[jscontroller="sWGJ4b"]');
      
      if (parent) {
        const heading = parent.querySelector('[role="heading"] .M7eMe');
        if (heading) {
          return heading.textContent.trim();
        }
      }

      return '';
    }

    /**
     * Fill the date input with value
     * @param {HTMLInputElement} input - Date input element
     * @param {string} isoDate - Date in ISO format (YYYY-MM-DD)
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _fillDateInput(input, isoDate) {
      try {
        // Scroll into view
        if (typeof DOMUtils !== 'undefined' && DOMUtils.scrollIntoView) {
          DOMUtils.scrollIntoView(input);
          await this.sleep(TIMING.SHORT_DELAY);
        }

        // Focus the input
        input.focus();
        await this.sleep(TIMING.SHORT_DELAY);

        // Set the value
        input.value = isoDate;

        // Dispatch events to trigger Google Forms validation
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(TIMING.SHORT_DELAY);
        
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.sleep(TIMING.MEDIUM_DELAY);

        // Blur to finalize
        input.blur();
        await this.sleep(TIMING.SHORT_DELAY);

        // Verify
        if (input.value === isoDate) {
          this.logger.info(`Date filled: ${isoDate}`);
          return true;
        }

        // Retry with different approach
        return await this._retryFill(input, isoDate);

      } catch (error) {
        this.logger.error(`Error filling date: ${error.message}`);
        return false;
      }
    }

    /**
     * Retry filling with alternative methods
     * @param {HTMLInputElement} input - Date input element
     * @param {string} isoDate - Date in ISO format
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _retryFill(input, isoDate) {
      try {
        // Method 2: Use setAttribute
        input.setAttribute('value', isoDate);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.sleep(TIMING.MEDIUM_DELAY);

        if (input.value === isoDate) {
          return true;
        }

        // Method 3: Use Object.getOwnPropertyDescriptor
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 
          'value'
        ).set;
        
        nativeInputValueSetter.call(input, isoDate);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.sleep(TIMING.MEDIUM_DELAY);

        return input.value === isoDate;

      } catch (error) {
        this.logger.warn(`Retry fill failed: ${error.message}`);
        return false;
      }
    }
  }

  // Expose to global namespace
  global.DateFiller = DateFiller;

})(window);