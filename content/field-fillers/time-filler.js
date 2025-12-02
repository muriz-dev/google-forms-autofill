// Filler for time input fields

(function(global) {
  'use strict';

  /**
   * Time Field Filler
   * Handles filling time input fields in Google Forms
   * 
   * Supported value formats:
   * - HH:MM (24-hour): "14:30", "09:05"
   * - H:MM: "9:05", "14:30"
   * - HH.MM: "14.30" (dot separator)
   * - HHMM: "1430", "0905"
   */
  class TimeFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.TIME);
    }

    /**
     * Fill a time field
     * @param {Object} field - Field object with time value
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      if (!field.value) {
        this.logger.info(`Skipping empty value for: "${field.question}"`);
        return false;
      }

      // Parse time value
      const timeParts = this._parseTime(field.value);
      
      if (!timeParts) {
        this.logger.warn(`Invalid time format for: "${field.question}", value: "${field.value}"`);
        this.logFillResult(false, field.question);
        return false;
      }

      const controller = this._findTimeController(field.question);

      if (!controller) {
        this.logFillResult(false, field.question);
        return false;
      }

      const success = await this._fillTimeInputs(controller, timeParts);
      this.logFillResult(success, field.question);
      
      return success;
    }

    /**
     * Parse various time formats into { hour, minute }
     * @param {string} timeValue - Time value in various formats
     * @returns {Object|null} - { hour: string, minute: string } or null if invalid
     * @private
     */
    _parseTime(timeValue) {
      if (!timeValue) return null;

      const value = timeValue.trim();

      // HH:MM format (e.g., "14:30", "09:05")
      let match = value.match(/^(\d{1,2}):(\d{2})$/);
      if (match) {
        return this._validateAndFormat(match[1], match[2]);
      }

      // HH.MM format (e.g., "14.30")
      match = value.match(/^(\d{1,2})\.(\d{2})$/);
      if (match) {
        return this._validateAndFormat(match[1], match[2]);
      }

      // HHMM format (e.g., "1430", "0905")
      match = value.match(/^(\d{2})(\d{2})$/);
      if (match) {
        return this._validateAndFormat(match[1], match[2]);
      }

      // H:MM format without leading zero (e.g., "9:05")
      match = value.match(/^(\d{1}):(\d{2})$/);
      if (match) {
        return this._validateAndFormat(match[1], match[2]);
      }

      return null;
    }

    /**
     * Validate and format hour/minute values
     * @param {string} hour - Hour string
     * @param {string} minute - Minute string
     * @returns {Object|null} - Formatted { hour, minute } or null if invalid
     * @private
     */
    _validateAndFormat(hour, minute) {
      const h = parseInt(hour, 10);
      const m = parseInt(minute, 10);

      // Validate ranges
      if (h < 0 || h > 23) return null;
      if (m < 0 || m > 59) return null;

      return {
        hour: h.toString(),  // No padding - Google Forms handles it
        minute: m.toString().padStart(2, '0')  // Minutes need padding
      };
    }

    /**
     * Find time controller by question text
     * @param {string} question - Question text to match
     * @returns {HTMLElement|null} - Time controller element or null
     * @private
     */
    _findTimeController(question) {
      const timeControllers = document.querySelectorAll('[jscontroller="OZjhxc"]');

      for (const controller of timeControllers) {
        const controllerQuestion = this._getQuestionText(controller);
        
        if (controllerQuestion === question) {
          return controller;
        }
      }

      this.logger.warn(`Time controller not found for: "${question}"`);
      return null;
    }

    /**
     * Get question text from controller's parent
     * @param {HTMLElement} controller - Time controller element
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
     * Fill hour and minute inputs
     * @param {HTMLElement} controller - Time controller element
     * @param {Object} timeParts - { hour, minute }
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _fillTimeInputs(controller, timeParts) {
      const hourInput = this._findHourInput(controller);
      const minuteInput = this._findMinuteInput(controller);

      if (!hourInput || !minuteInput) {
        this.logger.error('Could not find hour or minute input');
        return false;
      }

      try {
        // Fill hour
        const hourSuccess = await this._fillInput(hourInput, timeParts.hour);
        if (!hourSuccess) {
          this.logger.warn('Failed to fill hour input');
          return false;
        }

        await this.sleep(TIMING.SHORT_DELAY);

        // Fill minute
        const minuteSuccess = await this._fillInput(minuteInput, timeParts.minute);
        if (!minuteSuccess) {
          this.logger.warn('Failed to fill minute input');
          return false;
        }

        this.logger.info(`Time filled: ${timeParts.hour}:${timeParts.minute}`);
        return true;

      } catch (error) {
        this.logger.error(`Error filling time: ${error.message}`);
        return false;
      }
    }

    /**
     * Fill a single input with value
     * @param {HTMLInputElement} input - Input element
     * @param {string} value - Value to fill
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _fillInput(input, value) {
      try {
        // Scroll into view
        if (typeof DOMUtils !== 'undefined' && DOMUtils.scrollIntoView) {
          DOMUtils.scrollIntoView(input);
          await this.sleep(TIMING.SHORT_DELAY);
        }

        // Focus the input
        input.focus();
        await this.sleep(TIMING.SHORT_DELAY);

        // Clear existing value
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(TIMING.SHORT_DELAY);

        // Set new value
        input.value = value;

        // Dispatch events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await this.sleep(TIMING.SHORT_DELAY);
        
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await this.sleep(TIMING.SHORT_DELAY);

        // Blur to trigger validation
        input.blur();
        await this.sleep(TIMING.SHORT_DELAY);

        return true;

      } catch (error) {
        this.logger.error(`Error filling input: ${error.message}`);
        return false;
      }
    }

    /**
     * Find hour input in controller
     * @param {HTMLElement} controller - Time controller
     * @returns {HTMLInputElement|null}
     * @private
     */
    _findHourInput(controller) {
      // Try Indonesian label
      let input = controller.querySelector('input[aria-label="Jam"]');
      if (input) return input;

      // Try English label
      input = controller.querySelector('input[aria-label="Hour"]');
      if (input) return input;

      // Try by jsname
      const hourContainer = controller.querySelector('[jsname="MKaSrf"]');
      if (hourContainer) {
        input = hourContainer.querySelector('input');
        if (input) return input;
      }

      // Fallback: first input
      const inputs = controller.querySelectorAll('input[type="text"]');
      return inputs.length >= 1 ? inputs[0] : null;
    }

    /**
     * Find minute input in controller
     * @param {HTMLElement} controller - Time controller
     * @returns {HTMLInputElement|null}
     * @private
     */
    _findMinuteInput(controller) {
      // Try Indonesian label
      let input = controller.querySelector('input[aria-label="Menit"]');
      if (input) return input;

      // Try English label
      input = controller.querySelector('input[aria-label="Minute"]');
      if (input) return input;

      // Try by jsname
      const minuteContainer = controller.querySelector('[jsname="QbtXXe"]');
      if (minuteContainer) {
        input = minuteContainer.querySelector('input');
        if (input) return input;
      }

      // Fallback: second input
      const inputs = controller.querySelectorAll('input[type="text"]');
      return inputs.length >= 2 ? inputs[1] : null;
    }
  }

  // Expose to global namespace
  global.TimeFiller = TimeFiller;

})(window);