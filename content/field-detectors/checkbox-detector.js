// Detector for standard checkbox fields (multiple selection - non-grid)

(function(global) {
  'use strict';

  /**
   * Checkbox Field Detector
   * Handles standard checkbox groups only
   */
  class CheckboxDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.CHECKBOX);
    }

    /**
     * Detect all standard checkbox fields in the form
     * Filters out grid-type checkboxes
     * @returns {Array} - Array of checkbox field objects
     */
    detect() {
      const fields = [];
      
      // Find checkbox containers (div with role="list" containing checkboxes)
      const checkboxContainers = this._findCheckboxContainers();

      for (const container of checkboxContainers) {
        // Skip if this is a grid checkbox
        if (this._isGridCheckboxContainer(container)) {
          const question = this._getQuestionFromContainer(container);
          this.logger.info(`Skipping grid checkbox: "${question}"`);
          continue;
        }

        const field = this._extractFieldFromContainer(container);
        if (field) {
          fields.push(field);
        }
      }

      this.logDetectionResult(fields.length);
      return fields;
    }

    /**
     * Find all checkbox containers in the form
     * A checkbox container is identified by:
     * - Having role="list" with checkbox children, OR
     * - Being inside jscontroller="sW52Ae" (standard checkbox controller)
     * @returns {Array<HTMLElement>} - Array of container elements
     * @private
     */
    _findCheckboxContainers() {
      const containers = [];
      const seen = new Set();

      // Strategy 1: Find by jscontroller (most reliable for standard checkboxes)
      // Standard checkbox uses jscontroller="sW52Ae"
      const checkboxControllers = document.querySelectorAll('[jscontroller="sW52Ae"]');
      
      for (const controller of checkboxControllers) {
        if (!seen.has(controller)) {
          seen.add(controller);
          containers.push(controller);
        }
      }

      // Strategy 2: Find role="list" that contains checkboxes (fallback)
      const lists = document.querySelectorAll('[role="list"]');
      
      for (const list of lists) {
        // Must have checkbox children
        const hasCheckbox = list.querySelector('[role="checkbox"]');
        if (!hasCheckbox) continue;

        // Get the parent question container
        const questionContainer = list.closest('[jscontroller="sWGJ4b"]');
        if (questionContainer && !seen.has(questionContainer)) {
          // Check if this is already covered by a controller
          const existingController = questionContainer.querySelector('[jscontroller="sW52Ae"]');
          if (!existingController || !seen.has(existingController)) {
            seen.add(questionContainer);
            containers.push(questionContainer);
          }
        }
      }

      return containers;
    }

    /**
     * Check if a container is a grid checkbox
     * @param {HTMLElement} container - Container element
     * @returns {boolean} - True if this is a grid checkbox
     * @private
     */
    _isGridCheckboxContainer(container) {
      // Check the parent question container
      const parent = container.closest('[jscontroller="sWGJ4b"]') || container;

      // Indicator 1: Has grid container class e12QUd
      if (parent.querySelector('.e12QUd')) {
        return true;
      }

      // Indicator 2: Has jscontroller="tjSPQb" (grid controller)
      if (parent.querySelector('[jscontroller="tjSPQb"]')) {
        return true;
      }

      // Indicator 3: Has checkbox with data-field-index (grid rows have this)
      if (parent.querySelector('[role="checkbox"][data-field-index]')) {
        return true;
      }

      // Indicator 4: Has EzyPc class (grid row class)
      if (parent.querySelector('.EzyPc')) {
        return true;
      }

      return false;
    }

    /**
     * Get question text from container
     * @param {HTMLElement} container - Container element
     * @returns {string} - Question text
     * @private
     */
    _getQuestionFromContainer(container) {
      const parent = container.closest('[jscontroller="sWGJ4b"]') || container;
      return this.getQuestionText(parent);
    }

    /**
     * Extract field data from a checkbox container
     * @param {HTMLElement} container - Container element
     * @returns {Object|null} - Field object or null if no valid checkboxes
     * @private
     */
    _extractFieldFromContainer(container) {
      const parent = container.closest('[jscontroller="sWGJ4b"]') || container;
      const checkboxes = this._findValidCheckboxes(parent);

      if (checkboxes.length === 0) {
        return null;
      }

      const questionText = this.getQuestionText(parent);
      const options = this._extractOptions(checkboxes);

      if (options.length === 0) {
        return null;
      }

      return this.createFieldObject({
        question: questionText || 'Checkboxes',
        options: options,
        metadata: {
          isGrid: false
        },
        value: []
      });
    }

    /**
     * Find valid checkboxes in container (exclude grid, disabled, and "other" option)
     * @param {HTMLElement} container - Container element
     * @returns {Array<HTMLElement>} - Array of valid checkbox elements
     * @private
     */
    _findValidCheckboxes(container) {
      const allCheckboxes = container.querySelectorAll('[role="checkbox"]');
      const validCheckboxes = [];

      for (const checkbox of allCheckboxes) {
        // Skip if inside grid container
        if (checkbox.closest('.gTGYUd') || checkbox.closest('.e12QUd')) {
          continue;
        }

        // Skip if disabled (mobile duplicate)
        if (checkbox.getAttribute('aria-disabled') === 'true') {
          continue;
        }

        // Skip if it's the "other" option
        if (this._isOtherOption(checkbox)) {
          continue;
        }

        // Skip if has data-field-index (grid indicator)
        if (checkbox.hasAttribute('data-field-index')) {
          continue;
        }

        validCheckboxes.push(checkbox);
      }

      return validCheckboxes;
    }

    /**
     * Check if checkbox is the "Other" option
     * @param {HTMLElement} checkbox - Checkbox element
     * @returns {boolean} - True if this is "other" option
     * @private
     */
    _isOtherOption(checkbox) {
      // Check data-answer-value
      const answerValue = checkbox.getAttribute('data-answer-value');
      if (answerValue === '__other_option__') {
        return true;
      }

      // Check data-other-checkbox attribute
      if (checkbox.hasAttribute('data-other-checkbox')) {
        return true;
      }

      // Check aria-label for "Yang lain" or "Other"
      const ariaLabel = checkbox.getAttribute('aria-label') || '';
      if (ariaLabel.toLowerCase().includes('yang lain') || 
          ariaLabel.toLowerCase().includes('other:')) {
        return true;
      }

      return false;
    }

    /**
     * Extract option labels from checkbox elements
     * @param {Array<HTMLElement>} checkboxes - Array of checkbox elements
     * @returns {Array<string>} - Array of unique option strings
     * @private
     */
    _extractOptions(checkboxes) {
      const options = [];
      const seen = new Set();

      for (const checkbox of checkboxes) {
        const optionText = this._getOptionText(checkbox);

        if (optionText && !seen.has(optionText)) {
          seen.add(optionText);
          options.push(optionText);
        }
      }

      return options;
    }

    /**
     * Get option text from a checkbox element
     * @param {HTMLElement} checkbox - Checkbox element
     * @returns {string} - Option text
     * @private
     */
    _getOptionText(checkbox) {
      // Priority 1: data-answer-value (most reliable)
      const answerValue = checkbox.getAttribute('data-answer-value');
      if (answerValue && answerValue !== '__other_option__') {
        return this._normalizeText(answerValue);
      }

      // Priority 2: aria-label (clean up artifacts)
      const ariaLabel = checkbox.getAttribute('aria-label');
      if (ariaLabel) {
        // Remove "jawaban untuk" artifact from grid-style labels
        const cleaned = ariaLabel.split(',')[0];
        return this._normalizeText(cleaned);
      }

      // Priority 3: Label text content
      const label = checkbox.closest('label');
      if (label) {
        const textSpan = label.querySelector('.aDTYNe');
        if (textSpan) {
          return this._normalizeText(textSpan.textContent);
        }
        return this._normalizeText(label.textContent);
      }

      return '';
    }

    /**
     * Normalize text for consistent storage and matching
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
  global.CheckboxDetector = CheckboxDetector;

})(window);