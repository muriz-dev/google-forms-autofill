// Main content script for Google Forms Auto-Fill extension

(function() {
  'use strict';

  const logger = createLogger('ContentScript');

  // Declare detectors and fillers at outer scope
  let detectors = null;
  let fillers = null;

  logger.info('Google Forms Auto-Fill extension loaded!');
  logger.info('Waiting for all modules to load...');

  // Wait for all classes to be loaded
  setTimeout(() => {
    initializeExtension();
  }, 300);

  function initializeExtension() {
    // Check if classes are available
    if (typeof TextDetector === 'undefined') {
      logger.error('Detector classes not loaded! Retrying...');
      setTimeout(initializeExtension, 500);
      return;
    }

    logger.success('All modules loaded!');

    // Initialize detectors
    detectors = {
      text: new TextDetector(),
      textarea: new TextareaDetector(),
      radio: new RadioDetector(),
      checkbox: new CheckboxDetector(),
      dropdown: new DropdownDetector(),
      date: new DateDetector(),
      time: new TimeDetector()
    };

    // Initialize fillers
    fillers = {
      text: new TextFiller(),
      textarea: new TextareaFiller(),
      radio: new RadioFiller(),
      checkbox: new CheckboxFiller(),
      dropdown: new DropdownFiller(),
      date: new DateFiller(),
      time: new TimeFiller()
    };

    // Setup event listeners and create UI
    setupMessageListener();
    // createFloatingButton();

    // Success message
    logger.success('Content script initialized!');
  }

  /**
   * Detect all form fields
   * @returns {Array} - Array of all detected fields
   */
  function detectAllFields() {
    if (!detectors) {
      logger.warn('Detectors not initialized yet');
      return [];
    }

    const allFields = [];

    // Detect each field type
    Object.keys(detectors).forEach(type => {
      const fields = detectors[type].detect();
      allFields.push(...fields);
    });

    logger.info(`Detected ${allFields.length} total fields`);
    return allFields;
  }

  /**
   * Fill all fields with provided data
   * @param {Array} fieldsData - Array of field objects with values
   * @returns {Promise<Object>} - Fill results { success, failed }
   */
  async function fillAllFields(fieldsData) {
    if (!fillers) {
      logger.warn('Fillers not initialized yet');
      return { success: 0, failed: fieldsData.length };
    }

    logger.info(`Filling ${fieldsData.length} fields...`);

    let successCount = 0;
    let failedCount = 0;

    for (const field of fieldsData) {
      const filler = fillers[field.type];

      if (!filler) {
        logger.warn(`No filler found for type: ${field.type}`);
        failedCount++;
        continue;
      }

      try {
        const success = await filler.fill(field);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        logger.error(`Error filling field "${field.question}":`, error.message);
        failedCount++;
      }
    }

    logger.success(`Fill complete: ${successCount} success, ${failedCount} failed`);

    return { success: successCount, failed: failedCount };
  }

  /**
   * Save current form data to storage
   */
  async function saveFormData() {
    const fields = detectAllFields();

    if (fields.length === 0) {
      logger.warn('No fields detected to save');
      return false;
    }

    const success = await StorageHelper.set(STORAGE_KEYS.SAVED_FORM_DATA, fields);

    if (success) {
      logger.success(`Saved ${fields.length} fields to storage`);
    } else {
      logger.error('Failed to save form data');
    }

    return success;
  }

  /**
   * Load and fill form with saved data
   */
  async function loadAndFillForm() {
    const savedData = await StorageHelper.get(STORAGE_KEYS.SAVED_FORM_DATA);

    if (!savedData || savedData.length === 0) {
      logger.warn('No saved data found');
      return { success: 0, failed: 0 };
    }

    logger.info(`Loading ${savedData.length} fields from storage`);

    return await fillAllFields(savedData);
  }

  /**
   * Clear saved form data
   */
  async function clearSavedData() {
    const success = await StorageHelper.remove(STORAGE_KEYS.SAVED_FORM_DATA);

    if (success) {
      logger.success('Cleared saved form data');
    } else {
      logger.error('Failed to clear saved data');
    }

    return success;
  }

  /**
   * Setup message listener for popup communication
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      logger.info(`Received message: ${request.action}`);

      (async () => {
        try {
          switch (request.action) {
            case 'detectFields':
              const fields = detectAllFields();
              sendResponse({ success: true, data: fields });
              break;

            case 'saveFormData':
              // Allow popup to provide data payload to save (preferred), otherwise detect and save
              if (request.data && Array.isArray(request.data)) {
                try {
                  const setSuccess = await StorageHelper.set(STORAGE_KEYS.SAVED_FORM_DATA, request.data);
                  sendResponse({ success: setSuccess });
                } catch (err) {
                  logger.error('Error saving provided form data:', err);
                  sendResponse({ success: false, error: err && err.message ? err.message : String(err) });
                }
              } else {
                const saveSuccess = await saveFormData();
                sendResponse({ success: saveSuccess });
              }
              break;

            case 'fillForm':
              const fillResult = await fillAllFields(request.data);
              sendResponse({ success: true, result: fillResult });
              break;

            case 'loadAndFill':
              const loadResult = await loadAndFillForm();
              sendResponse({ success: true, result: loadResult });
              break;

            case 'clearData':
              const clearSuccess = await clearSavedData();
              sendResponse({ success: clearSuccess });
              break;

            default:
              logger.warn(`Unknown action: ${request.action}`);
              sendResponse({ success: false, error: 'Unknown action' });
          }
        } catch (error) {
          logger.error('Error handling message:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();

      // Return true to indicate async response
      return true;
    });
  }

  /**
   * Create floating button for quick access
   */
  // function createFloatingButton() {
  //   // Check if button already exists
  //   if (document.getElementById('gforms-autofill-btn')) {
  //     return;
  //   }

  //   const button = document.createElement('button');
  //   button.id = 'gforms-autofill-btn';
  //   button.innerHTML = '🤖 Auto-Fill';
  //   button.style.cssText = `
  //     position: fixed;
  //     bottom: 20px;
  //     right: 20px;
  //     z-index: 10000;
  //     padding: 12px 20px;
  //     background: #1a73e8;
  //     color: white;
  //     border: none;
  //     border-radius: 24px;
  //     font-size: 14px;
  //     font-weight: 500;
  //     cursor: pointer;
  //     box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  //     transition: all 0.2s;
  //   `;

  //   // Hover effect
  //   button.addEventListener('mouseenter', () => {
  //     button.style.transform = 'scale(1.05)';
  //     button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  //   });

  //   button.addEventListener('mouseleave', () => {
  //     button.style.transform = 'scale(1)';
  //     button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  //   });

  //   // Click handler
  //   button.addEventListener('click', async () => {
  //     button.disabled = true;
  //     button.innerHTML = '⏳ Filling...';

  //     const result = await loadAndFillForm();

  //     if (result.success > 0) {
  //       button.innerHTML = `✅ Filled ${result.success} fields!`;
  //       button.style.background = '#0d652d';
  //     } else {
  //       button.innerHTML = '❌ No data to fill';
  //       button.style.background = '#d93025';
  //     }

  //     setTimeout(() => {
  //       button.innerHTML = '🤖 Auto-Fill';
  //       button.style.background = '#1a73e8';
  //       button.disabled = false;
  //     }, 2000);
  //   });

  //   // Wait for DOM ready
  //   if (document.body) {
  //     document.body.appendChild(button);
  //     logger.success('Floating button created');
  //   } else {
  //     // Wait for body if not ready yet
  //     if (document.readyState === 'loading') {
  //       document.addEventListener('DOMContentLoaded', () => {
  //         if (document.body && !document.getElementById('gforms-autofill-btn')) {
  //           document.body.appendChild(button);
  //           logger.success('Floating button created');
  //         }
  //       });
  //     }
  //   }
  // }
})();