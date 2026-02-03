// Detector for Multiple Choice Grid fields (grid with radio buttons)

(function(global) {
  'use strict';

  /**
   * Radio Grid Detector
   * Handles Multiple Choice Grid fields where each row has radio buttons for columns
   */
  class RadioGridDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.RADIO_GRID);
    }

    /**
     * Detect all Multiple Choice Grid fields in the form
     * @returns {Array} - Array of grid field objects
     */
    detect() {
      const fields = [];
      
      // Find all grid containers
      const gridContainers = document.querySelectorAll('.e12QUd');

      gridContainers.forEach((container, index) => {
        // Check if this is a radio grid (not checkbox grid)
        if (this._isRadioGrid(container)) {
          const field = this._extractGridField(container, index);
          if (field) {
            fields.push(field);
          }
        }
      });

      this.logDetectionResult(fields.length);
      return fields;
    }

    /**
     * Check if the grid container is a radio grid (vs checkbox grid)
     * @param {HTMLElement} container - Grid container element
     * @returns {boolean} - True if this is a radio grid
     * @private
     */
    _isRadioGrid(container) {
      // Radio grids have radiogroups, checkbox grids don't
      const radioGroups = container.querySelectorAll('[role="radiogroup"]');
      return radioGroups.length > 0;
    }

    /**
     * Extract field data from a grid container
     * @param {HTMLElement} container - Grid container element
     * @param {number} index - Container index for fallback naming
     * @returns {Object|null} - Field object or null if invalid
     * @private
     */
    _extractGridField(container, index) {
      const questionText = this._getGridQuestionText(container);
      const columns = this._extractColumns(container);
      const rows = this._extractRows(container);

      if (rows.length === 0 || columns.length === 0) {
        this.logger.warn(`Grid ${index + 1} has no rows or columns, skipping`);
        return null;
      }

      return this.createFieldObject({
        question: questionText || `Multiple Choice Grid ${index + 1}`,
        metadata: {
          columns: columns,
          rows: rows,
          gridType: 'radio'
        },
        // Value will be an object mapping row names to selected column values
        // Example: { "Row 1": "Column 2", "Row 2": "Column 1" }
        value: {}
      });
    }

    /**
     * Get question text for the grid
     * @param {HTMLElement} container - Grid container element
     * @returns {string} - Question text
     * @private
     */
    _getGridQuestionText(container) {
      // Look for the heading element
      const heading = container.closest('[jsname="WsjYwc"]')?.querySelector('[role="heading"]');
      if (heading) {
        return heading.textContent.trim();
      }
      return '';
    }

    /**
     * Extract column headers from the grid
     * @param {HTMLElement} container - Grid container element
     * @returns {Array<string>} - Array of column names
     * @private
     */
    _extractColumns(container) {
      const columns = [];
      
      // Find the header row
      const headerRow = container.querySelector('.ssX1Bd.KZt9Tc');
      if (headerRow) {
        const columnCells = headerRow.querySelectorAll('.V4d7Ke.OIC90c');
        columnCells.forEach(cell => {
          const text = cell.textContent.trim();
          if (text) {
            columns.push(text);
          }
        });
      }

      return columns;
    }

    /**
     * Extract row labels from the grid
     * @param {HTMLElement} container - Grid container element
     * @returns {Array<Object>} - Array of row objects with label and fieldIndex
     * @private
     */
    _extractRows(container) {
      const rows = [];
      
      // Find all radiogroups (each represents a row)
      const radioGroups = container.querySelectorAll('[role="radiogroup"][data-field-index]');
      
      radioGroups.forEach(group => {
        const rowLabel = group.getAttribute('aria-label');
        const fieldIndex = group.getAttribute('data-field-index');
        
        if (rowLabel) {
          rows.push({
            label: rowLabel,
            fieldIndex: fieldIndex
          });
        }
      });

      return rows;
    }
  }

  // Expose to global namespace
  global.RadioGridDetector = RadioGridDetector;

})(window);
