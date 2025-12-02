// Event dispatching helper utilities

(function(global) {
  'use strict';

  const EventUtils = {
    /**
     * Sleep/delay utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Dispatch a mouse event on element
     * @param {HTMLElement} element - Target element
     * @param {string} eventType - Event type (mousedown, mouseup, click, etc.)
     * @param {Object} options - Event options
     */
    dispatchMouseEvent(element, eventType, options = {}) {
      const defaultOptions = {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0
      };

      const event = new MouseEvent(eventType, { ...defaultOptions, ...options });
      element.dispatchEvent(event);
    },

    /**
     * Dispatch a keyboard event on element
     * @param {HTMLElement} element - Target element
     * @param {string} eventType - Event type (keydown, keyup, keypress)
     * @param {Object} options - Event options
     */
    dispatchKeyboardEvent(element, eventType, options = {}) {
      const defaultOptions = {
        bubbles: true,
        cancelable: true,
        key: 'Enter'
      };

      const event = new KeyboardEvent(eventType, { ...defaultOptions, ...options });
      element.dispatchEvent(event);
    },

    /**
     * Dispatch input change events (for form validation)
     * @param {HTMLElement} element - Input element
     */
    dispatchInputEvents(element) {
      const events = [
        new Event('input', { bubbles: true, cancelable: true }),
        new Event('change', { bubbles: true, cancelable: true }),
        new Event('blur', { bubbles: true, cancelable: true })
      ];

      events.forEach(event => element.dispatchEvent(event));
    },

    /**
     * Simulate complete mouse click sequence
     * @param {HTMLElement} element - Element to click
     * @param {number} delay - Delay between events in ms
     */
    async simulateClick(element, delay = TIMING.SHORT_DELAY) {
      this.dispatchMouseEvent(element, 'mouseenter');
      await this.sleep(delay);
      
      this.dispatchMouseEvent(element, 'mousedown');
      await this.sleep(delay);
      
      element.click();
      await this.sleep(delay);
      
      this.dispatchMouseEvent(element, 'mouseup');
      await this.sleep(delay);
    },

    /**
     * Set input value with proper event triggering
     * @param {HTMLElement} input - Input element
     * @param {string} value - Value to set
     */
    async setInputValue(input, value) {
      // Focus
      input.focus();
      
      // Set value
      input.value = value;
      
      // Trigger events
      this.dispatchInputEvents(input);
      
      // Trigger keyboard events for Google Forms validation
      this.dispatchKeyboardEvent(input, 'keydown');
      this.dispatchKeyboardEvent(input, 'keyup');
      
      // Blur
      input.blur();
      
      // Re-trigger input after blur
      await this.sleep(TIMING.SHORT_DELAY);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },

    /**
     * Wait for condition to be true
     * @param {Function} condition - Condition function that returns boolean
     * @param {number} timeout - Max wait time in ms
     * @param {number} interval - Check interval in ms
     * @returns {Promise<boolean>} - True if condition met, false if timeout
     */
    async waitFor(condition, timeout = 3000, interval = 100) {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        if (condition()) {
          return true;
        }
        await this.sleep(interval);
      }
      
      return false;
    }
  };

  // Expose to global namespace
  global.EventUtils = EventUtils;

})(window);