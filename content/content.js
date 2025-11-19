// content/content.js - WITH DROPDOWN FIX

console.log('Google Forms Auto-Fill: Content script loaded');

// Fungsi untuk mendapatkan semua field di form
function getFormFields() {
  const fields = [];
  
  // 1. Text inputs (Short answer) - Improved selector
  const textInputs = document.querySelectorAll('input[type="text"][aria-labelledby]');
  textInputs.forEach((input, index) => {
    const labelId = input.getAttribute('aria-labelledby');
    const labelElement = labelId ? document.getElementById(labelId) : null;
    const questionText = labelElement ? labelElement.innerText.trim() : '';
    
    // Fallback: cari question dari parent structure
    if (!questionText) {
      const questionDiv = input.closest('[role="listitem"]');
      const heading = questionDiv ? questionDiv.querySelector('[role="heading"]') : null;
      if (heading) {
        fields.push({
          type: 'text',
          question: heading.innerText.trim(),
          ariaLabelledBy: labelId,
          dataParams: input.getAttribute('data-params'),
          value: ''
        });
        return;
      }
    }
    
    if (questionText) {
      fields.push({
        type: 'text',
        question: questionText,
        ariaLabelledBy: labelId,
        dataParams: input.getAttribute('data-params'),
        value: ''
      });
    }
  });
  
  // 2. Textarea (Paragraph)
  const textareas = document.querySelectorAll('textarea[aria-labelledby]');
  textareas.forEach((textarea, index) => {
    const labelId = textarea.getAttribute('aria-labelledby');
    const labelElement = labelId ? document.getElementById(labelId) : null;
    const questionText = labelElement ? labelElement.innerText.trim() : '';
    
    if (!questionText) {
      const questionDiv = textarea.closest('[role="listitem"]');
      const heading = questionDiv ? questionDiv.querySelector('[role="heading"]') : null;
      if (heading) {
        fields.push({
          type: 'textarea',
          question: heading.innerText.trim(),
          ariaLabelledBy: labelId,
          dataParams: textarea.getAttribute('data-params'),
          value: ''
        });
        return;
      }
    }
    
    if (questionText) {
      fields.push({
        type: 'textarea',
        question: questionText,
        ariaLabelledBy: labelId,
        dataParams: textarea.getAttribute('data-params'),
        value: ''
      });
    }
  });
  
  // 3. Radio buttons (Multiple choice)
  const radioGroups = document.querySelectorAll('[role="radiogroup"]');
  radioGroups.forEach((group, index) => {
    const questionDiv = group.closest('[role="listitem"]');
    const heading = questionDiv ? questionDiv.querySelector('[role="heading"]') : null;
    const questionText = heading ? heading.innerText.trim() : `Multiple Choice ${index + 1}`;
    
    const options = [];
    const radios = group.querySelectorAll('[role="radio"]');
    radios.forEach(radio => {
      const label = radio.getAttribute('aria-label') || radio.innerText.trim();
      if (label) options.push(label);
    });
    
    if (options.length > 0) {
      fields.push({
        type: 'radio',
        question: questionText,
        options: options,
        groupDataParams: group.getAttribute('data-params'),
        value: ''
      });
    }
  });
  
  // 4. Checkboxes
  const listItems = document.querySelectorAll('[role="listitem"]');
  listItems.forEach((item, index) => {
    const checkboxGroup = item.querySelector('[role="group"]');
    if (!checkboxGroup) return;
    
    const checkboxes = checkboxGroup.querySelectorAll('[role="checkbox"]');
    if (checkboxes.length === 0) return;
    
    const heading = item.querySelector('[role="heading"]');
    const questionText = heading ? heading.innerText.trim() : `Checkboxes ${index + 1}`;
    
    const options = [];
    checkboxes.forEach(checkbox => {
      const label = checkbox.getAttribute('aria-label') || checkbox.innerText.trim();
      if (label) options.push(label);
    });
    
    if (options.length > 0) {
      fields.push({
        type: 'checkbox',
        question: questionText,
        options: options,
        groupDataParams: checkboxGroup.getAttribute('data-params'),
        value: []
      });
    }
  });
  
  // 5. Dropdowns (Select/Listbox)
  const dropdowns = document.querySelectorAll('[role="listbox"]');
  dropdowns.forEach((dropdown, index) => {
    const questionDiv = dropdown.closest('[role="listitem"]');
    const heading = questionDiv ? questionDiv.querySelector('[role="heading"]') : null;
    const questionText = heading ? heading.innerText.trim() : `Dropdown ${index + 1}`;
    
    // Get current selected value
    const selectedOption = dropdown.querySelector('[aria-selected="true"]');
    const currentValue = selectedOption ? selectedOption.getAttribute('data-value') || selectedOption.innerText.trim() : '';
    
    // Try to get all options
    const options = [];
    const optionElements = dropdown.querySelectorAll('[role="option"]');
    
    optionElements.forEach(option => {
      const value = option.getAttribute('data-value') || option.innerText.trim();
      if (value && value !== 'Choose' && value !== 'Pilih') {
        options.push(value);
      }
    });
    
    if (options.length === 0) {
      fields.push({
        type: 'dropdown',
        question: questionText,
        options: ['(Need to click dropdown to see options)'],
        ariaLabel: dropdown.getAttribute('aria-label'),
        dataParams: dropdown.getAttribute('data-params'),
        value: currentValue,
        needsExpansion: true
      });
    } else {
      fields.push({
        type: 'dropdown',
        question: questionText,
        options: options,
        ariaLabel: dropdown.getAttribute('aria-label'),
        dataParams: dropdown.getAttribute('data-params'),
        value: currentValue,
        needsExpansion: false
      });
    }
  });
  
  return fields;
}

// Fungsi untuk fill form dengan data yang tersimpan
async function fillForm(formData) {
  let filledCount = 0;
  let errorCount = 0;
  
  for (const field of formData) {
    try {
      let success = false;
      
      switch(field.type) {
        case 'text':
          success = fillTextInput(field);
          break;
        case 'textarea':
          success = fillTextarea(field);
          break;
        case 'radio':
          success = fillRadioButton(field);
          break;
        case 'checkbox':
          success = fillCheckbox(field);
          break;
        case 'dropdown':
          success = await fillDropdown(field);
          break;
      }
      
      if (success) {
        filledCount++;
      } else {
        errorCount++;
        console.warn(`Failed to fill field: ${field.question}`);
      }
    } catch(error) {
      errorCount++;
      console.error(`Error filling field: ${field.question}`, error);
    }
  }
  
  console.log(`Fill complete: ${filledCount} success, ${errorCount} errors`);
  return { filledCount, errorCount };
}

function fillTextInput(field) {
  if (!field.value) return false;
  
  // Strategy 1: Find by aria-labelledby
  if (field.ariaLabelledBy) {
    const input = document.querySelector(`input[type="text"][aria-labelledby="${field.ariaLabelledBy}"]`);
    if (input) {
      return setInputValue(input, field.value);
    }
  }
  
  // Strategy 2: Find by data-params
  if (field.dataParams) {
    const input = document.querySelector(`input[type="text"][data-params="${field.dataParams}"]`);
    if (input) {
      return setInputValue(input, field.value);
    }
  }
  
  // Strategy 3: Find by question text
  const allTextInputs = document.querySelectorAll('input[type="text"]');
  for (const input of allTextInputs) {
    const labelId = input.getAttribute('aria-labelledby');
    if (labelId) {
      const label = document.getElementById(labelId);
      if (label && label.innerText.trim() === field.question) {
        return setInputValue(input, field.value);
      }
    }
    
    const questionDiv = input.closest('[role="listitem"]');
    const heading = questionDiv ? questionDiv.querySelector('[role="heading"]') : null;
    if (heading && heading.innerText.trim() === field.question) {
      return setInputValue(input, field.value);
    }
  }
  
  return false;
}

function fillTextarea(field) {
  if (!field.value) return false;
  
  // Strategy 1: Find by aria-labelledby
  if (field.ariaLabelledBy) {
    const textarea = document.querySelector(`textarea[aria-labelledby="${field.ariaLabelledBy}"]`);
    if (textarea) {
      return setInputValue(textarea, field.value);
    }
  }
  
  // Strategy 2: Find by data-params
  if (field.dataParams) {
    const textarea = document.querySelector(`textarea[data-params="${field.dataParams}"]`);
    if (textarea) {
      return setInputValue(textarea, field.value);
    }
  }
  
  // Strategy 3: Find by question text
  const allTextareas = document.querySelectorAll('textarea');
  for (const textarea of allTextareas) {
    const questionDiv = textarea.closest('[role="listitem"]');
    const heading = questionDiv ? questionDiv.querySelector('[role="heading"]') : null;
    if (heading && heading.innerText.trim() === field.question) {
      return setInputValue(textarea, field.value);
    }
  }
  
  return false;
}

function fillRadioButton(field) {
  if (!field.value) return false;
  
  const radioGroups = document.querySelectorAll('[role="radiogroup"]');
  
  for (const group of radioGroups) {
    const questionDiv = group.closest('[role="listitem"]');
    const heading = questionDiv ? questionDiv.querySelector('[role="heading"]') : null;
    const questionText = heading ? heading.innerText.trim() : '';
    
    if (questionText === field.question) {
      const radios = group.querySelectorAll('[role="radio"]');
      
      for (const radio of radios) {
        const label = radio.getAttribute('aria-label') || radio.innerText.trim();
        
        if (label === field.value) {
          const isSelected = radio.getAttribute('aria-checked') === 'true';
          if (!isSelected) {
            radio.click();
            setTimeout(() => {}, 100);
          }
          return true;
        }
      }
    }
  }
  
  return false;
}

function fillCheckbox(field) {
  if (!field.value || field.value.length === 0) return false;
  
  const listItems = document.querySelectorAll('[role="listitem"]');
  
  for (const item of listItems) {
    const heading = item.querySelector('[role="heading"]');
    const questionText = heading ? heading.innerText.trim() : '';
    
    if (questionText === field.question) {
      const checkboxGroup = item.querySelector('[role="group"]');
      if (!checkboxGroup) continue;
      
      const checkboxes = checkboxGroup.querySelectorAll('[role="checkbox"]');
      let successCount = 0;
      
      checkboxes.forEach(checkbox => {
        const label = checkbox.getAttribute('aria-label') || checkbox.innerText.trim();
        const isChecked = checkbox.getAttribute('aria-checked') === 'true';
        const shouldBeChecked = field.value.includes(label);
        
        if (isChecked !== shouldBeChecked) {
          checkbox.click();
          setTimeout(() => {}, 50);
          successCount++;
        } else if (shouldBeChecked) {
          successCount++;
        }
      });
      
      return successCount > 0;
    }
  }
  
  return false;
}

async function fillDropdown(field) {
  if (!field.value) return false;
  
  console.log(`[Dropdown] Attempting to fill: "${field.question}" with value: "${field.value}"`);
  
  const listItems = document.querySelectorAll('[role="listitem"]');
  
  for (const item of listItems) {
    const heading = item.querySelector('[role="heading"]');
    const questionText = heading ? heading.innerText.trim() : '';
    
    if (questionText === field.question) {
      const dropdown = item.querySelector('[role="listbox"]');
      if (!dropdown) {
        console.warn('[Dropdown] Listbox not found');
        continue;
      }
      
      console.log('[Dropdown] Found matching dropdown');
      
      // Check if dropdown needs expansion
      const isCollapsed = dropdown.getAttribute('aria-expanded') === 'false';
      
      if (isCollapsed) {
        console.log('[Dropdown] Expanding dropdown...');
        
        // Try multiple methods based on manual test
        // Method 1: Click presentation layer
        const presentation = dropdown.querySelector('[role="presentation"]');
        if (presentation) {
          console.log('[Dropdown] Trying presentation layer click...');
          presentation.click();
        } else {
          console.log('[Dropdown] Trying dropdown click...');
          dropdown.click();
        }
        
        await sleep(300);
        
        // Wait for aria-expanded to change
        let attempts = 0;
        while (dropdown.getAttribute('aria-expanded') !== 'true' && attempts < 15) {
          await sleep(100);
          attempts++;
          
          // Retry with mousedown if not expanded after 5 attempts
          if (attempts === 5 && dropdown.getAttribute('aria-expanded') !== 'true') {
            console.log('[Dropdown] Retrying with mousedown event...');
            dropdown.dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              view: window
            }));
          }
        }
        
        const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
        console.log(`[Dropdown] Expanded: ${isExpanded} (after ${attempts * 100}ms)`);
        
        if (!isExpanded) {
          console.warn('[Dropdown] Failed to expand dropdown');
          return false;
        }
      }
      
      // Look for the popup container
      const popupContainer = dropdown.querySelector('[jsname="V68bde"]');
      
      if (!popupContainer) {
        console.warn('[Dropdown] Popup container (V68bde) not found');
        return false;
      }
      
      // Wait for popup to be visible
      let popupVisible = false;
      let waitAttempts = 0;
      
      while (!popupVisible && waitAttempts < 15) {
        const popupStyle = window.getComputedStyle(popupContainer);
        popupVisible = popupStyle.display !== 'none';
        
        if (!popupVisible) {
          await sleep(100);
          waitAttempts++;
        }
      }
      
      console.log(`[Dropdown] Popup visible: ${popupVisible} (after ${waitAttempts * 100}ms)`);
      
      if (!popupVisible) {
        console.warn('[Dropdown] Popup not visible, checking if options are in LgbsSe instead...');
        
        // Fallback: Some forms show options directly in LgbsSe without popup
        const lgbsseContainer = dropdown.querySelector('[jsname="LgbsSe"]');
        if (lgbsseContainer) {
          const directOptions = lgbsseContainer.querySelectorAll('[role="option"]');
          if (directOptions.length > 0) {
            console.log(`[Dropdown] Found ${directOptions.length} options in LgbsSe (no popup)`);
            
            // Use these options instead
            let targetOption = null;
            
            for (const option of directOptions) {
              const dataValue = option.getAttribute('data-value');
              const spanElement = option.querySelector('.vRMGwf') || option.querySelector('span');
              const optionText = spanElement ? spanElement.innerText.trim() : option.innerText.trim();
              
              if (!dataValue || dataValue === '' || optionText === 'Choose' || optionText === 'Pilih') {
                continue;
              }
              
              if (optionText === field.value || dataValue === field.value) {
                targetOption = option;
                console.log(`[Dropdown] ✓ Found in LgbsSe: "${optionText}"`);
                break;
              }
            }
            
            if (targetOption) {
              targetOption.click();
              await sleep(300);
              
              const selected = dropdown.querySelector('[role="option"][aria-selected="true"]');
              const selectedValue = selected ? selected.getAttribute('data-value') : '';
              console.log(`[Dropdown] Final value: "${selectedValue}"`);
              
              return selectedValue === field.value;
            }
          }
        }
        
        return false;
      }
      
      // Wait for options to render in popup
      await sleep(300);
      
      // Get options from popup container
      let options = popupContainer.querySelectorAll('[role="option"]');
      
      if (options.length === 0) {
        console.log('[Dropdown] Trying jsname selector...');
        options = popupContainer.querySelectorAll('[jsname="wQNmvb"]');
      }
      
      if (options.length === 0) {
        console.log('[Dropdown] Trying data-value selector...');
        options = popupContainer.querySelectorAll('[data-value]');
      }
      
      console.log(`[Dropdown] Found ${options.length} options in popup`);
      
      if (options.length === 0) {
        console.error('[Dropdown] No options found');
        return false;
      }
      
      // Find target option
      let targetOption = null;
      
      for (const option of options) {
        const dataValue = option.getAttribute('data-value');
        const spanElement = option.querySelector('.vRMGwf') || option.querySelector('span');
        const optionText = spanElement ? spanElement.innerText.trim() : option.innerText.trim();
        
        if (!dataValue || dataValue === '' || optionText === 'Choose' || optionText === 'Pilih') {
          continue;
        }
        
        console.log(`[Dropdown] Checking: "${optionText}" (data-value: "${dataValue}")`);
        
        if (optionText === field.value || dataValue === field.value) {
          targetOption = option;
          console.log(`[Dropdown] ✓ Found: "${optionText}"`);
          break;
        }
      }
      
      if (!targetOption) {
        console.warn(`[Dropdown] ✗ Not found: "${field.value}"`);
        
        const available = Array.from(options)
          .map(o => {
            const dv = o.getAttribute('data-value');
            const span = o.querySelector('.vRMGwf') || o.querySelector('span');
            const txt = span ? span.innerText.trim() : o.innerText.trim();
            return `"${txt}" (${dv})`;
          })
          .filter(v => !v.includes('()') && !v.includes('Choose') && !v.includes('Pilih'));
        
        console.log('[Dropdown] Available:', available);
        
        document.body.click();
        await sleep(200);
        return false;
      }
      
      // Click the option
      console.log('[Dropdown] Clicking option...');
      
      targetOption.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      await sleep(100);
      
      targetOption.dispatchEvent(new MouseEvent('mouseenter', { 
        bubbles: true, 
        cancelable: true,
        view: window 
      }));
      await sleep(50);
      
      targetOption.dispatchEvent(new MouseEvent('mousedown', { 
        bubbles: true, 
        cancelable: true,
        view: window,
        button: 0
      }));
      await sleep(50);
      
      targetOption.click();
      await sleep(50);
      
      targetOption.dispatchEvent(new MouseEvent('mouseup', { 
        bubbles: true, 
        cancelable: true,
        view: window,
        button: 0
      }));
      
      await sleep(400);
      
      dropdown.dispatchEvent(new Event('change', { bubbles: true }));
      dropdown.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(200);
      
      // Verify
      const selected = dropdown.querySelector('[role="option"][aria-selected="true"]');
      const selectedValue = selected ? selected.getAttribute('data-value') : '';
      
      console.log(`[Dropdown] Final value: "${selectedValue}"`);
      
      if (selectedValue === field.value) {
        console.log('[Dropdown] ✓ Success!');
        return true;
      } else {
        console.warn('[Dropdown] ✗ Verification failed');
        return false;
      }
    }
  }
  
  console.warn(`[Dropdown] Question "${field.question}" not found`);
  return false;
}

// Helper: Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Set input value
function setInputValue(element, value) {
  if (!element) return false;
  
  element.focus();
  element.value = value;
  
  const events = [
    new Event('input', { bubbles: true, cancelable: true }),
    new Event('change', { bubbles: true, cancelable: true }),
    new Event('blur', { bubbles: true, cancelable: true }),
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }),
    new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter' })
  ];
  
  events.forEach(event => element.dispatchEvent(event));
  element.blur();
  
  setTimeout(() => {
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, 50);
  
  return true;
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFields') {
    try {
      const fields = getFormFields();
      console.log('Fields detected:', fields);
      sendResponse({ fields: fields });
    } catch (error) {
      console.error('Error getting fields:', error);
      sendResponse({ fields: [], error: error.message });
    }
  }
  
  if (request.action === 'fillForm') {
    fillForm(request.data).then(result => {
      sendResponse({ success: true, ...result });
    }).catch(error => {
      console.error('Error filling form:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }
  
  return true;
});

// Floating button
function addAutoFillButton() {
  if (document.getElementById('auto-fill-btn')) return;
  
  const button = document.createElement('button');
  button.id = 'auto-fill-btn';
  button.innerHTML = '⚡ Auto Fill';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
  `;
  
  button.onmouseover = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
  };
  
  button.onmouseout = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  };
  
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.innerHTML = '⏳ Filling...';
    
    try {
      const result = await chrome.storage.local.get(['savedFormData']);
      
      if (result.savedFormData) {
        const fillResult = await fillForm(result.savedFormData);
        
        button.innerHTML = `✅ Filled ${fillResult.filledCount}`;
        button.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
        
        setTimeout(() => {
          button.innerHTML = '⚡ Auto Fill';
          button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          button.disabled = false;
        }, 2000);
      } else {
        button.innerHTML = '❌ No data';
        button.style.background = 'linear-gradient(135deg, #f44336 0%, #da190b 100%)';
        
        setTimeout(() => {
          button.innerHTML = '⚡ Auto Fill';
          button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      button.innerHTML = '❌ Error';
      button.disabled = false;
    }
  });
  
  document.body.appendChild(button);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addAutoFillButton);
} else {
  addAutoFillButton();
}

const observer = new MutationObserver(() => {
  if (!document.getElementById('auto-fill-btn')) {
    addAutoFillButton();
  }
});

observer.observe(document.body, { childList: true, subtree: true });  