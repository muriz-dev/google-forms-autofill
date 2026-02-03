// Filler for Multiple Choice Grid fields

(function(global) {
  'use strict';

  /**
   * Radio Grid Filler
   * Handles filling Multiple Choice Grid fields where each row has radio buttons
   */
  class RadioGridFiller extends BaseFiller {
    constructor() {
      super(FIELD_TYPES.RADIO_GRID);
    }

    /**
     * Fill a Multiple Choice Grid field
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
      for (const [rowLabel, columnValue] of Object.entries(field.value)) {
        if (!columnValue) continue;
        
        totalRows++;
        const filled = await this._fillGridRow(gridContainer, rowLabel, columnValue);
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
     * @param {string} columnValue - Value of the column to select
     * @returns {Promise<boolean>} - Success status
     * @private
     */
    async _fillGridRow(gridContainer, rowLabel, columnValue) {
      // Find the radiogroup for this row
      const radioGroups = gridContainer.querySelectorAll('[role="radiogroup"]');
      
      for (const group of radioGroups) {
        const groupLabel = group.getAttribute('aria-label');
        
        if (groupLabel === rowLabel) {
          // Find the radio button with the matching column value
          const radios = group.querySelectorAll('[role="radio"]');
          
          for (const radio of radios) {
            const radioValue = radio.getAttribute('data-value');
            
            if (radioValue === columnValue) {
              // Check if already selected
              if (radio.getAttribute('aria-checked') === 'true') {
                this.logger.info(`Row "${rowLabel}" already has "${columnValue}" selected`);
                return true;
              }

              // Click the radio button to select it
              await this._clickRadio(radio);
              
              // Wait a bit for the UI to update
              await this.delay(TIMING.SHORT_DELAY);
              
              // Verify selection
              const isChecked = radio.getAttribute('aria-checked') === 'true';
              if (isChecked) {
                this.logger.success(`Selected "${columnValue}" for row "${rowLabel}"`);
                return true;
              } else {
                this.logger.warn(`Failed to select "${columnValue}" for row "${rowLabel}"`);
                return false;
              }
            }
          }
          
          this.logger.warn(`Column "${columnValue}" not found for row "${rowLabel}"`);
          return false;
        }
      }
      
      this.logger.warn(`Row "${rowLabel}" not found in grid`);
      return false;
    }

    /**
     * Click a radio button element
     * @param {HTMLElement} radio - Radio button element
     * @returns {Promise<void>}
     * @private
     */
    async _clickRadio(radio) {
      // Trigger mouse events to ensure the form recognizes the selection
      const events = ['mousedown', 'mouseup', 'click'];

      for (const type of events) {
        radio.dispatchEvent(
          new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window
          })
        );
        await this.delay(10);
      }
      
      // Trigger change event on the radio group
      const group = radio.closest('[role="radiogroup"]');
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
          // Verify this is a radio grid
          const radioGroups = container.querySelectorAll('[role="radiogroup"]');
          if (radioGroups.length > 0) {
            return container;
          }
        }
      }
      
      this.logger.warn(`Grid not found: "${questionText}"`);
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
  global.RadioGridFiller = RadioGridFiller;

})(window);
