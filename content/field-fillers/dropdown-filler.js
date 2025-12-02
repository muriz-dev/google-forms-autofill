// Filler for dropdown fields

(function(global) {
  'use strict';

  /**
   * Dropdown Filler
   */
  class DropdownFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.DROPDOWN);
    }

    /**
     * Fill dropdown field
     * @param {Object} field - Field object with value
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      if (!field.value) {
        this.logger.info(`Skipping empty value for: "${field.question}"`);
        return false;
      }

      const listItems = this.getAllListItems();

      for (const item of listItems) {
        const question = DOMUtils.getQuestionText(item);

        if (question === field.question) {
          const dropdown = item.querySelector(SELECTORS.LISTBOX);
          if (!dropdown) {
            this.logger.warn('Listbox not found');
            continue;
          }

          // Expand dropdown if needed
          const expanded = await this.expandDropdown(dropdown);
          if (!expanded) {
            this.logFillResult(false, field.question);
            return false;
          }

          // Get popup container
          const popupContainer = dropdown.querySelector(SELECTORS.DROPDOWN_POPUP);
          if (!popupContainer) {
            this.logger.warn('Popup container not found');
            return false;
          }

          // Wait for popup to be visible
          const visible = await this.waitForPopupVisible(popupContainer);
          if (!visible) {
            this.logger.warn('Popup not visible');
            return false;
          }

          // Find and click target option
          const success = await this.selectOption(popupContainer, dropdown, field.value);
          this.logFillResult(success, field.question);
          return success;
        }
      }

      this.logFillResult(false, field.question);
      return false;
    }

    /**
     * Expand dropdown
     * @param {HTMLElement} dropdown - Dropdown element
     * @returns {Promise<boolean>} - Success status
     */
    async expandDropdown(dropdown) {
      const isCollapsed = dropdown.getAttribute('aria-expanded') === 'false';

      if (!isCollapsed) {
        return true; // Already expanded
      }

      // Try clicking presentation layer
      const presentation = dropdown.querySelector(SELECTORS.DROPDOWN_PRESENTATION);
      if (presentation) {
        presentation.click();
      } else {
        dropdown.click();
      }

      await this.sleep(TIMING.LONG_DELAY);

      // Wait for expansion
      let attempts = 0;
      while (dropdown.getAttribute('aria-expanded') !== 'true' && attempts < TIMING.MAX_WAIT_ATTEMPTS) {
        await this.sleep(TIMING.MEDIUM_DELAY);
        attempts++;

        // Retry with mousedown after several attempts
        if (attempts === 5 && dropdown.getAttribute('aria-expanded') !== 'true') {
          EventUtils.dispatchMouseEvent(dropdown, 'mousedown');
        }
      }

      const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        this.logger.info(`Expanded after ${attempts * TIMING.MEDIUM_DELAY}ms`);
      }

      return isExpanded;
    }

    /**
     * Wait for popup container to be visible
     * @param {HTMLElement} popupContainer - Popup container element
     * @returns {Promise<boolean>} - Success status
     */
    async waitForPopupVisible(popupContainer) {
      let attempts = 0;

      while (attempts < TIMING.MAX_WAIT_ATTEMPTS) {
        const style = window.getComputedStyle(popupContainer);
        if (style.display !== 'none') {
          await this.sleep(TIMING.VALIDATION_WAIT); // Stabilization delay
          return true;
        }

        await this.sleep(TIMING.MEDIUM_DELAY);
        attempts++;
      }

      return false;
    }

    /**
     * Select option from popup
     * @param {HTMLElement} popupContainer - Popup container
     * @param {HTMLElement} dropdown - Dropdown element
     * @param {string} targetValue - Value to select
     * @returns {Promise<boolean>} - Success status
     */
    async selectOption(popupContainer, dropdown, targetValue) {
      // Get options - try multiple selectors
      let options = popupContainer.querySelectorAll(SELECTORS.OPTION);

      if (options.length === 0) {
        options = popupContainer.querySelectorAll(SELECTORS.DROPDOWN_OPTION);
      }

      if (options.length === 0) {
        options = popupContainer.querySelectorAll('[data-value]');
      }

      this.logger.info(`Found ${options.length} options in popup`);

      if (options.length === 0) {
        return false;
      }

      // Find target option
      let targetOption = null;

      for (const option of options) {
        const dataValue = option.getAttribute('data-value');
        const textElement = option.querySelector(SELECTORS.OPTION_TEXT) || option.querySelector('span');
        const optionText = textElement ? textElement.innerText.trim() : option.innerText.trim();

        // Skip placeholder
        if (!dataValue || dataValue === '' || optionText === 'Choose' || optionText === 'Pilih') {
          continue;
        }

        if (optionText === targetValue || dataValue === targetValue) {
          targetOption = option;
          this.logger.info(`Found option: "${optionText}"`);
          break;
        }
      }

      if (!targetOption) {
        this.logger.warn(`Option "${targetValue}" not found`);
        return false;
      }

      // Click option
      DOMUtils.scrollIntoView(targetOption);
      await this.sleep(TIMING.MEDIUM_DELAY);

      await EventUtils.simulateClick(targetOption, TIMING.SHORT_DELAY);
      await this.sleep(TIMING.EXPANSION_WAIT);

      // Trigger change events
      dropdown.dispatchEvent(new Event('change', { bubbles: true }));
      dropdown.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(TIMING.VALIDATION_WAIT);

      // Verify selection
      const selected = dropdown.querySelector('[role="option"][aria-selected="true"]');
      const selectedValue = selected ? selected.getAttribute('data-value') : '';

      return selectedValue === targetValue;
    }
  }

  // Expose to global namespace
  global.DropdownFiller = DropdownFiller;

})(window);