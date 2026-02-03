// Detector for Checkbox Grid fields (grid with checkboxes)

(function(global) {
  'use strict';

  /**
   * Checkbox Grid Detector
   * Handles Checkbox Grid fields where each row has checkboxes for columns (multiple selections per row)
   */
  class CheckboxGridDetector extends BaseDetector {
    constructor() {
      super(FIELD_TYPES.CHECKBOX_GRID);
    }

    /**
     * Detect all Checkbox Grid fields in the form
     * @returns {Array} - Array of grid field objects
     */
    detect() {
      const fields = [];
      
      // Find all grid containers
      const gridContainers = document.querySelectorAll('.e12QUd');

      gridContainers.forEach((container, index) => {
        // Check if this is a checkbox grid (not radio grid)
        if (this._isCheckboxGrid(container)) {
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
     * Check if the grid container is a checkbox grid (vs radio grid)
     * @param {HTMLElement} container - Grid container element
     * @returns {boolean} - True if this is a checkbox grid
     * @private
     */
    _isCheckboxGrid(container) {
      // Checkbox grids have groups with checkboxes, not radiogroups
      const hasRadioGroups = container.querySelectorAll('[role="radiogroup"]').length > 0;
      const hasCheckboxGroups = container.querySelectorAll('[role="group"][jsname="IfcKPb"]').length > 0;
      
      // It's a checkbox grid if it has checkbox groups but no radio groups
      return hasCheckboxGroups && !hasRadioGroups;
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
        question: questionText || `Checkbox Grid ${index + 1}`,
        metadata: {
          columns: columns,
          rows: rows,
          gridType: 'checkbox'
        },
        // Value will be an object mapping row names to arrays of selected column values
        // Example: { "Row 1": ["Column 1", "Column 3"], "Row 2": ["Column 2"] }
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
      
      // Find all checkbox groups (each represents a row)
      const checkboxGroups = container.querySelectorAll('[role="group"][jsname="IfcKPb"]');
      
      checkboxGroups.forEach((group, idx) => {
        // Get row label from the first cell
        const rowLabelCell = group.querySelector('.V4d7Ke.wzWPxe.OIC90c');
        if (rowLabelCell) {
          const rowLabel = rowLabelCell.textContent.trim();
          
          // Get field index from the first checkbox in the group
          const firstCheckbox = group.querySelector('[role="checkbox"][data-field-index]');
          const fieldIndex = firstCheckbox ? firstCheckbox.getAttribute('data-field-index') : idx.toString();
          
          if (rowLabel) {
            rows.push({
              label: rowLabel,
              fieldIndex: fieldIndex
            });
          }
        }
      });

      return rows;
    }
  }

  // Expose to global namespace
  global.CheckboxGridDetector = CheckboxGridDetector;

})(window);
