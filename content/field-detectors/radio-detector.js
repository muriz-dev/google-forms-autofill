// Detector for single-selection radio button fields (multiple choice - one answer)

(function(global) {
  'use strict';

  /**
   * Radio Button Field Detector
   * Handles single-selection radio groups only
   */
  class RadioDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.RADIO);
    }

    /**
     * Detect all single-selection radio button fields in the form
     * Filters out grid-type radio inputs using DOM structure analysis
     * @returns {Array} - Array of radio field objects
     */
    detect() {
      const fields = [];
      const radioGroups = document.querySelectorAll(SELECTORS.RADIO_GROUP);

      radioGroups.forEach((group, index) => {
        // Skip grid radio groups
        if (this._isGridRadioGroup(group)) {
          this.logger.info(`Skipping grid radio group at index ${index}`);
          return;
        }

        const field = this._extractFieldFromGroup(group, index);
        if (field) {
          fields.push(field);
        }
      });

      this.logDetectionResult(fields.length);
      return fields;
    }

    /**
     * Check if a radio group is part of a grid (Multiple Choice Grid)
     * Uses multiple DOM indicators for reliable detection
     * @param {HTMLElement} group - Radio group element
     * @returns {boolean} - True if this is a grid radio group
     * @private
     */
    _isGridRadioGroup(group) {
      // Indicator 1: Has data-field-index attribute (grid rows have this)
      if (group.hasAttribute('data-field-index')) {
        return true;
      }

      // Indicator 2: Has EzyPc class (specific to grid radio groups)
      if (group.classList.contains('EzyPc')) {
        return true;
      }

      // Indicator 3: Parent/ancestor has e12QUd class (grid container)
      if (group.closest('.e12QUd')) {
        return true;
      }

      // Indicator 4: Parent has jscontroller="tjSPQb" (grid controller)
      if (group.closest('[jscontroller="tjSPQb"]')) {
        return true;
      }

      return false;
    }

    /**
     * Extract field data from a single radio group element
     * @param {HTMLElement} group - Radio group element
     * @param {number} index - Group index for fallback naming
     * @returns {Object|null} - Field object or null if invalid
     * @private
     */
    _extractFieldFromGroup(group, index) {
      const questionText = this.getQuestionText(group);
      const options = this._extractOptions(group);

      if (options.length === 0) {
        this.logger.warn(`Radio group ${index + 1} has no options, skipping`);
        return null;
      }

      return this.createFieldObject({
        question: questionText || `Multiple Choice ${index + 1}`,
        options: options,
        metadata: {
          groupDataParams: group.getAttribute('data-params')
        },
        value: ''
      });
    }

    /**
     * Extract option labels from radio group
     * @param {HTMLElement} group - Radio group element
     * @returns {Array<string>} - Array of option labels
     * @private
     */
    _extractOptions(group) {
      const options = [];
      const radios = group.querySelectorAll(SELECTORS.RADIO);

      radios.forEach(radio => {
        const label = radio.getAttribute('aria-label') || radio.innerText.trim();
        if (label) {
          options.push(label);
        }
      });

      return options;
    }
  }

  // Expose to global namespace
  global.RadioDetector = RadioDetector;

})(window);