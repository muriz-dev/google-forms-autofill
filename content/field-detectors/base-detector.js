// Base class for field detectors

(function(global) {
  'use strict';

  /**
   * Base Detector Class
   * All field detectors inherit from this
   */
  class BaseDetector {
    constructor(fieldType) {
      this.fieldType = fieldType;
      this.logger = createLogger(`Detector:${fieldType}`);
    }

    /**
     * Detect fields of this type in the form
     * Must be implemented by child classes
     * @returns {Array} - Array of field objects
     */
    detect() {
      throw new Error('detect() must be implemented by child class');
    }

    /**
     * Create field object with common structure
     * @param {Object} config - Field configuration
     * @returns {Object} - Standardized field object
     */
    createFieldObject(config) {
      return {
        type: this.fieldType,
        question: config.question || '',
        value: config.value || (this.fieldType === FIELD_TYPES.CHECKBOX ? [] : ''),
        options: config.options || [],
        // Metadata for finding field later
        ariaLabelledBy: config.ariaLabelledBy || null,
        dataParams: config.dataParams || null,
        ...config.metadata
      };
    }

    /**
     * Get question text from element
     * @param {HTMLElement} element - Form field element
     * @returns {string} - Question text
     */
    getQuestionText(element) {
      return DOMUtils.getQuestionText(element);
    }

    /**
     * Get all list items from form
     * @returns {NodeList} - List items
     */
    getAllListItems() {
      return DOMUtils.getAllListItems();
    }

    /**
     * Log detection result
     * @param {number} count - Number of fields detected
     */
    logDetectionResult(count) {
      if (count > 0) {
        this.logger.success(`Detected ${count} ${this.fieldType} field(s)`);
      } else {
        this.logger.info(`No ${this.fieldType} fields found`);
      }
    }
  }

  // Expose to global namespace
  global.BaseDetector = BaseDetector;

})(window);