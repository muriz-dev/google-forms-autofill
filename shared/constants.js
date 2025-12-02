// Shared constants across the extension

(function(global) {
  'use strict';

  /**
   * Field types supported by the extension
   */
  const FIELD_TYPES = {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    DROPDOWN: 'dropdown',
    DATE: 'date',
    TIME: 'time',
    // Future field types (not yet implemented)
    RADIO_GRID: 'radio_grid',       // Multiple Choice Grid
    CHECKBOX_GRID: 'checkbox_grid'  // Checkbox Grid
  };

  /**
   * Storage keys used in Chrome Storage
   */
  const STORAGE_KEYS = {
    SAVED_FORM_DATA: 'savedFormData',
    USER_PREFERENCES: 'userPreferences',
    FORM_TEMPLATES: 'formTemplates'
  };

  /**
   * CSS Selectors for Google Forms elements
   */
  const SELECTORS = {
    // Form structure
    LIST_ITEM: '[role="listitem"]',
    HEADING: '[role="heading"]',
    
    // Input types
    TEXT_INPUT: 'input[type="text"][aria-labelledby]',
    TEXTAREA: 'textarea[aria-labelledby]',
    RADIO_GROUP: '[role="radiogroup"]',
    RADIO: '[role="radio"]',
    CHECKBOX_GROUP: '[role="group"]',
    CHECKBOX: '[role="checkbox"]',
    LISTBOX: '[role="listbox"]',
    OPTION: '[role="option"]',
    
    // Dropdown specific
    DROPDOWN_PRESENTATION: '[role="presentation"]',
    DROPDOWN_POPUP: '[jsname="V68bde"]',
    DROPDOWN_OPTION: '[jsname="wQNmvb"]',
    OPTION_TEXT: '.vRMGwf',

    // Grid specific (for future use)
    GRID_CONTAINER: '.e12QUd',
    GRID_ROW_GROUP: '[role="radiogroup"][data-field-index]',
    GRID_HEADER_ROW: '.ssX1Bd.KZt9Tc',
    GRID_COLUMN_CELL: '.V4d7Ke.OIC90c',

    // Date specific
    DATE_CONTROLLER: '[jscontroller="lLliLe"]',
    DATE_INPUT: 'input[type="date"]',

    // Time specific
    TIME_CONTROLLER: '[jscontroller="OZjhxc"]',
    TIME_HOUR_INPUT: 'input[aria-label="Jam"], input[aria-label="Hour"]',
    TIME_MINUTE_INPUT: 'input[aria-label="Menit"], input[aria-label="Minute"]'
  };

  /**
   * Timing constants (in milliseconds)
   */
  const TIMING = {
    SHORT_DELAY: 50,
    MEDIUM_DELAY: 100,
    LONG_DELAY: 300,
    EXPANSION_WAIT: 500,
    VALIDATION_WAIT: 200,
    MAX_WAIT_ATTEMPTS: 15
  };

  /**
   * Status message types
   */
  const STATUS_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning'
  };

  /**
   * Extension metadata
   */
  const EXTENSION_INFO = {
    NAME: 'Google Forms Auto-Fill',
    VERSION: '1.0.0',
    GITHUB_URL: 'https://github.com/YOUR_USERNAME/google-forms-autofill'
  };

  // Expose to global namespace
  global.FIELD_TYPES = FIELD_TYPES;
  global.STORAGE_KEYS = STORAGE_KEYS;
  global.SELECTORS = SELECTORS;
  global.TIMING = TIMING;
  global.STATUS_TYPES = STATUS_TYPES;
  global.EXTENSION_INFO = EXTENSION_INFO;

})(window);