// DOM manipulation helper utilities

(function(global) {
  'use strict';

  const DOMUtils = {
    /**
     * Get question text from a form field element
     * @param {HTMLElement} element - Form field element
     * @returns {string} - Question text or empty string
     */
    getQuestionText(element) {
      // Try to get from closest list item (heading inside the same list item)
      const listItem = element.closest(SELECTORS.LIST_ITEM);
      if (listItem) {
        const heading = listItem.querySelector(SELECTORS.HEADING);
        if (heading) {
          return heading.innerText.trim();
        }
      }

      // Walk up ancestors to find a heading or aria-labelledby on a containing list/group
      let el = element;
      while (el) {
        try {
          if (el.querySelector) {
            const heading = el.querySelector(SELECTORS.HEADING);
            if (heading) return heading.innerText.trim();
          }

          if (el.hasAttribute && el.hasAttribute('aria-labelledby')) {
            const ids = el.getAttribute('aria-labelledby').split(/\s+/).filter(Boolean);
            const texts = ids.map(id => {
              const node = document.getElementById(id);
              return node ? node.innerText.trim() : '';
            }).filter(Boolean);

            if (texts.length > 0) return texts.join(' - ');
          }
        } catch (e) {
          // ignore and continue upwards
        }

        el = el.parentElement;
      }

      // Try to get from aria-labelledby on the element itself
      const labelId = element.getAttribute && element.getAttribute('aria-labelledby');
      if (labelId) {
        const label = document.getElementById(labelId);
        if (label) {
          return label.innerText.trim();
        }
      }

      return '';
    },

    /**
     * Find element by question text
     * @param {string} questionText - Question to search for
     * @param {string} selector - CSS selector for element type
     * @returns {HTMLElement|null} - Found element or null
     */
    findElementByQuestion(questionText, selector) {
      const elements = document.querySelectorAll(selector);
      
      for (const element of elements) {
        const question = this.getQuestionText(element);
        if (question === questionText) {
          return element;
        }
      }
      
      return null;
    },

    /**
     * Get all list items (questions) from the form
     * @returns {NodeList} - List of form question containers
     */
    getAllListItems() {
      return document.querySelectorAll(SELECTORS.LIST_ITEM);
    },

    /**
     * Check if element is visible
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} - True if visible
     */
    isVisible(element) {
      if (!element) return false;
      
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0';
    },

    /**
     * Wait for element to appear in DOM
     * @param {string} selector - CSS selector
     * @param {number} timeout - Max wait time in ms
     * @returns {Promise<HTMLElement|null>} - Found element or null
     */
    async waitForElement(selector, timeout = 5000) {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) {
          return element;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return null;
    },

    /**
     * Scroll element into view smoothly
     * @param {HTMLElement} element - Element to scroll to
     */
    scrollIntoView(element) {
      if (!element) return;
      
      element.scrollIntoView({
        block: 'nearest',
        behavior: 'auto'
      });
    },

    /**
     * Get text content from element, checking common text containers
     * @param {HTMLElement} element - Element to extract text from
     * @returns {string} - Extracted text
     */
    getTextContent(element) {
      // Try common Google Forms text containers
      const textElement = element.querySelector('.vRMGwf') || 
                         element.querySelector('span') ||
                         element;
      
      return textElement.innerText.trim();
    }
  };

  // Expose to global namespace
  global.DOMUtils = DOMUtils;

})(window);