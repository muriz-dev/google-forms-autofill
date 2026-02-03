// Filler for Checkbox Grid fields

(function(global) {
  'use strict';

  /**
   * Checkbox Grid Filler
   * Handles filling Checkbox Grid fields where each row has multiple checkboxes
   */
  class CheckboxGridFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.CHECKBOX_GRID);
    }

    /**
     * Fill a Checkbox Grid field
     * @param {Object} field - Field object with grid data
     * @returns {Promise<boolean>} - Success status
     */
    async fill(field) {
      if (!field.value || Object.keys(field.value).length === 0) {
        this.logger.info(`Skipping empty value for grid: "${field.question}"`);
        return false;
      }

      const gridContainer = this._findGridByQuestion(field.question);

      if (!gridContainer) {
        this.logFillResult(false, field.question);
        return false;
      }

      let successCount = 0;
      let totalRows = 0;

      // Iterate through each row that needs to be filled
      for (const [rowLabel, columnValues] of Object.entries(field.value)) {
        if (!columnValues || !Array.isArray(columnValues) || columnValues.length === 0) {
          continue;
        }
        
        totalRows++;
        const filled = await this._fillGridRow(gridContainer, rowLabel, columnValues);
        if (filled) {
          successCount++;
        }
      }

      const overallSuccess = successCount > 0;
      this.logger.info(
        `Grid "${field.question}": Filled ${successCount}/${totalRows} rows`
      );
      
      this.logFillResult(overallSuccess, field.question);
      return overallSuccess;
    }

    /**
     * Fill a single row in the grid
     * @param {HTMLElement} gridContainer - Grid container element
     * @param {string} rowLabel - Label of the row to fill
     * @param {Array<string>} columnValues - Array of column values to select
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _fillGridRow(gridContainer, rowLabel, columnValues) {
      // Find the checkbox group for this row
      const checkboxGroups = gridContainer.querySelectorAll('[role="group"][jsname="IfcKPb"]');
      
      for (const group of checkboxGroups) {
        const rowLabelCell = group.querySelector('.V4d7Ke.wzWPxe.OIC90c');
        
        if (rowLabelCell && rowLabelCell.textContent.trim() === rowLabel) {
          let checkedCount = 0;
          
          // Find all checkboxes in this row and check the ones that match our values
          const checkboxes = group.querySelectorAll('[role="checkbox"]');
          
          for (const checkbox of checkboxes) {
            const checkboxValue = checkbox.getAttribute('data-answer-value');
            const shouldBeChecked = columnValues.includes(checkboxValue);
            const isCurrentlyChecked = checkbox.getAttribute('aria-checked') === 'true';
            
            if (shouldBeChecked && !isCurrentlyChecked) {
              // Need to check this checkbox
              await this._clickCheckbox(checkbox);
              await this.delay(TIMING.SHORT_DELAY);
              checkedCount++;
            } else if (!shouldBeChecked && isCurrentlyChecked) {
              // Need to uncheck this checkbox
              await this._clickCheckbox(checkbox);
              await this.delay(TIMING.SHORT_DELAY);
            } else if (shouldBeChecked && isCurrentlyChecked) {
              // Already checked
              checkedCount++;
            }
          }
          
          if (checkedCount > 0) {
            this.logger.success(`Checked ${checkedCount} items for row "${rowLabel}"`);
            return true;
          } else {
            this.logger.warn(`No items checked for row "${rowLabel}"`);
            return false;
          }
        }
      }
      
      this.logger.warn(`Row "${rowLabel}" not found in grid`);
      return false;
    }

    /**
     * Click a checkbox element
     * @param {HTMLElement} checkbox - Checkbox element
     * @returns {Promise<void>}
     * @private
     */
    async _clickCheckbox(checkbox) {
      // Trigger mouse events to ensure the form recognizes the selection
      const events = ['mousedown', 'mouseup', 'click'];

      for (const type of events) {
        checkbox.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window
          })
        );
        await this.delay(10);
      }
      
      // Trigger change event on the checkbox group
      const group = checkbox.closest('[role="group"]');
      if (group) {
        group.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      }
    }

    /**
     * Find grid container by question text
     * @param {string} questionText - Question to search for
     * @returns {HTMLElement|null} - Grid container or null
     * @private
     */
    _findGridByQuestion(questionText) {
      const gridContainers = document.querySelectorAll('.e12QUd');
      
      for (const container of gridContainers) {
        const heading = container.closest('[jsname="WsjYwc"]')?.querySelector('[role="heading"]');
        
        if (heading && heading.textContent.trim() === questionText) {
          // Verify this is a checkbox grid (has checkbox groups, not radiogroups)
          const hasRadioGroups = container.querySelectorAll('[role="radiogroup"]').length > 0;
          const hasCheckboxGroups = container.querySelectorAll('[role="group"][jsname="IfcKPb"]').length > 0;
          
          if (hasCheckboxGroups && !hasRadioGroups) {
            return container;
          }
        }
      }
      
      this.logger.warn(`Checkbox grid not found: "${questionText}"`);
      return null;
    }

    /**
     * Small delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    async delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // Expose to global namespace
  global.CheckboxGridFiller = CheckboxGridFiller;

})(window);
