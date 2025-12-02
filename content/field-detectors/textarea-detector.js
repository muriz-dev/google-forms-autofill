// Detector for textarea fields (paragraph)

(function(global) {
  'use strict';

  /**
   * Textarea Field Detector
   */
  class TextareaDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.TEXTAREA);
    }

    /**
     * Detect all textarea fields in the form
     * @returns {Array} - Array of textarea field objects
     */
    detect() {
      const fields = [];
      const textareas = document.querySelectorAll(SELECTORS.TEXTAREA);

      textareas.forEach((textarea) => {
        const labelId = textarea.getAttribute('aria-labelledby');
        const labelElement = labelId ? document.getElementById(labelId) : null;
        let questionText = labelElement ? labelElement.innerText.trim() : '';

        // Fallback: try to get question from parent structure
        if (!questionText) {
          questionText = this.getQuestionText(textarea);
        }

        if (questionText) {
          fields.push(this.createFieldObject({
            question: questionText,
            ariaLabelledBy: labelId,
            dataParams: textarea.getAttribute('data-params'),
            value: ''
          }));
        }
      });

      this.logDetectionResult(fields.length);
      return fields;
    }
  }

  // Expose to global namespace
  global.TextareaDetector = TextareaDetector;

})(window);