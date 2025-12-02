// Detector for date input fields

(function(global) {
  'use strict';

  /**
   * Date Field Detector
   * Handles date input fields in Google Forms
   */
  class DateDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.DATE);
    }

    /**
     * Detect all date fields in the form
     * @returns {Array} - Array of date field objects
     */
    detect() {
      const fields = [];
      
      // Find all date controllers
      const dateControllers = document.querySelectorAll('[jscontroller="lLliLe"]');

      dateControllers.forEach((controller, index) => {
        const field = this._extractFieldFromController(controller, index);
        if (field) {
          fields.push(field);
        }
      });

      this.logDetectionResult(fields.length);
      return fields;
    }

    /**
     * Extract field data from date controller
     * @param {HTMLElement} controller - Date controller element
     * @param {number} index - Controller index for fallback naming
     * @returns {Object|null} - Field object or null if invalid
     * @private
     */
    _extractFieldFromController(controller, index) {
      // Find the date input
      const dateInput = controller.querySelector('input[type="date"]');
      
      if (!dateInput) {
        this.logger.warn(`Date controller ${index + 1} has no date input, skipping`);
        return null;
      }

      // Get question text from parent
      const questionText = this._getQuestionText(controller);
      
      // Get current value if any
      const currentValue = dateInput.value || '';

      // Check date configuration
      const includesYear = controller.getAttribute('data-includesyear') === 'true';
      const supportsDate = controller.getAttribute('data-supportsdate') === 'true';

      // Get max date if specified
      const maxDate = dateInput.getAttribute('max') || '';

      return this.createFieldObject({
        question: questionText || `Date ${index + 1}`,
        options: [],
        metadata: {
          includesYear: includesYear,
          supportsDate: supportsDate,
          maxDate: maxDate,
          inputId: dateInput.id || null
        },
        value: currentValue
      });
    }

    /**
     * Get question text from controller's parent
     * @param {HTMLElement} controller - Date controller element
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
      const dateContainer = controller.querySelector('[aria-labelledby]');
      if (dateContainer) {
        const labelledBy = dateContainer.getAttribute('aria-labelledby');
        if (labelledBy) {
          const labelIds = labelledBy.split(' ');
          for (const id of labelIds) {
            const labelEl = document.getElementById(id);
            if (labelEl) {
              const text = labelEl.textContent.trim();
              // Skip generic labels like "Tanggal"
              if (text && text !== 'Tanggal' && text !== 'Date') {
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
  global.DateDetector = DateDetector;

})(window);