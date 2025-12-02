// Detector for dropdown fields (select/listbox)

(function(global) {
  'use strict';

  /**
   * Dropdown Field Detector
   */
  class DropdownDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.DROPDOWN);
    }

    /**
     * Detect all dropdown fields in the form
     * @returns {Array} - Array of dropdown field objects
     */
    detect() {
      const fields = [];
      const dropdowns = document.querySelectorAll(SELECTORS.LISTBOX);

      dropdowns.forEach((dropdown, index) => {
        const questionText = this.getQuestionText(dropdown);

        // Get current selected value
        const selectedOption = dropdown.querySelector('[aria-selected="true"]');
        const currentValue = selectedOption ? 
          selectedOption.getAttribute('data-value') || selectedOption.innerText.trim() : '';

        // Try to get all options
        const options = [];
        const optionElements = dropdown.querySelectorAll(SELECTORS.OPTION);

        optionElements.forEach(option => {
          const value = option.getAttribute('data-value') || option.innerText.trim();
          if (value && value !== 'Choose' && value !== 'Pilih') {
            options.push(value);
          }
        });

        // Check if dropdown needs expansion to see options
        const needsExpansion = options.length === 0;

        fields.push(this.createFieldObject({
          question: questionText || `Dropdown ${index + 1}`,
          options: needsExpansion ? ['(Options will be detected on fill)'] : options,
          metadata: {
            ariaLabel: dropdown.getAttribute('aria-label'),
            dataParams: dropdown.getAttribute('data-params'),
            needsExpansion: needsExpansion
          },
          value: currentValue
        }));
      });

      this.logDetectionResult(fields.length);
      return fields;
    }
  }

  // Expose to global namespace
  global.DropdownDetector = DropdownDetector;

})(window);