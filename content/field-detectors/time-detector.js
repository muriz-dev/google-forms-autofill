// Detector for time input fields

(function(global) {
  'use strict';

  /**
   * Time Field Detector
   * Handles time input fields in Google Forms
   */
  class TimeDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.TIME);
    }

    /**
     * Detect all time fields in the form
     * @returns {Array} - Array of time field objects
     */
    detect() {
      const fields = [];
      
      // Find all time controllers
      const timeControllers = document.querySelectorAll('[jscontroller="OZjhxc"]');

      timeControllers.forEach((controller, index) => {
        const field = this._extractFieldFromController(controller, index);
        if (field) {
          fields.push(field);
        }
      });

      this.logDetectionResult(fields.length);
      return fields;
    }

    /**
     * Extract field data from time controller
     * @param {HTMLElement} controller - Time controller element
     * @param {number} index - Controller index for fallback naming
     * @returns {Object|null} - Field object or null if invalid
     * @private
     */
    _extractFieldFromController(controller, index) {
      // Find hour and minute inputs
      const hourInput = this._findHourInput(controller);
      const minuteInput = this._findMinuteInput(controller);
      
      if (!hourInput || !minuteInput) {
        this.logger.warn(`Time controller ${index + 1} missing hour or minute input, skipping`);
        return null;
      }

      // Get question text from parent
      const questionText = this._getQuestionText(controller);
      
      // Get current values if any
      const hourValue = hourInput.value || '';
      const minuteValue = minuteInput.value || '';
      
      // Combine into time string (HH:MM format)
      let currentValue = '';
      if (hourValue || minuteValue) {
        const hour = hourValue.padStart(2, '0');
        const minute = minuteValue.padStart(2, '0');
        currentValue = `${hour}:${minute}`;
      }

      return this.createFieldObject({
        question: questionText || `Time ${index + 1}`,
        options: [],
        metadata: {
          hourInputLabel: hourInput.getAttribute('aria-label'),
          minuteInputLabel: minuteInput.getAttribute('aria-label')
        },
        value: currentValue
      });
    }

    /**
     * Find hour input in controller
     * @param {HTMLElement} controller - Time controller
     * @returns {HTMLInputElement|null} - Hour input or null
     * @private
     */
    _findHourInput(controller) {
      // Try Indonesian label first
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

      // Fallback: first input in the controller
      const inputs = controller.querySelectorAll('input[type="text"]');
      if (inputs.length >= 1) {
        return inputs[0];
      }

      return null;
    }

    /**
     * Find minute input in controller
     * @param {HTMLElement} controller - Time controller
     * @returns {HTMLInputElement|null} - Minute input or null
     * @private
     */
    _findMinuteInput(controller) {
      // Try Indonesian label first
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

      // Fallback: second input in the controller
      const inputs = controller.querySelectorAll('input[type="text"]');
      if (inputs.length >= 2) {
        return inputs[1];
      }

      return null;
    }

    /**
     * Get question text from controller's parent
     * @param {HTMLElement} controller - Time controller element
     * @returns {string} - Question text
     * @private
     */
    _getQuestionText(controller) {
      // Find parent question container
      const parent = controller.closest('[jscontroller="sWGJ4b"]');
      
      if (parent) {
        // Look for heading
        const heading = parent.querySelector('[role="heading"] .M7eMe');
        if (heading) {
          return heading.textContent.trim();
        }
      }

      // Fallback: use aria-labelledby
      const groupContainer = controller.querySelector('[role="group"][aria-labelledby]');
      if (groupContainer) {
        const labelledBy = groupContainer.getAttribute('aria-labelledby');
        if (labelledBy) {
          const labelIds = labelledBy.split(' ');
          for (const id of labelIds) {
            const labelEl = document.getElementById(id);
            if (labelEl) {
              const text = labelEl.textContent.trim();
              // Skip generic labels
              if (text && text !== 'Waktu' && text !== 'Time') {
                return text;
              }
            }
          }
        }
      }

      return '';
    }
  }

  // Expose to global namespace
  global.TimeDetector = TimeDetector;

})(window);