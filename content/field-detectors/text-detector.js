// Detector for text input fields (short answer)

(function(global) {
  'use strict';

  /**
   * Text Input Field Detector
   */
  class TextDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.TEXT);
    }

    /**
     * Detect all text input fields in the form
     * @returns {Array} - Array of text field objects
     */
    detect() {
      const fields = [];
      const textInputs = document.querySelectorAll(SELECTORS.TEXT_INPUT);

      textInputs.forEach((input) => {
        const labelId = input.getAttribute('aria-labelledby');
        const labelElement = labelId ? document.getElementById(labelId) : null;
        let questionText = labelElement ? labelElement.innerText.trim() : '';

        // Fallback: try to get question from parent structure
        if (!questionText) {
          questionText = this.getQuestionText(input);
        }

        if (questionText) {
          fields.push(this.createFieldObject({
            question: questionText,
            ariaLabelledBy: labelId,
            dataParams: input.getAttribute('data-params'),
            value: ''
          }));
        }
      });

      this.logDetectionResult(fields.length);
      return fields;
    }
  }

  // Expose to global namespace
  global.TextDetector = TextDetector;

})(window);