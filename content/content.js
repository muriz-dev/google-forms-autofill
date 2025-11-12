// content/content.js - IMPROVED VERSION

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
  
  return fields;
}

// Fungsi untuk fill form dengan data yang tersimpan
function fillForm(formData) {
  let filledCount = 0;
  let errorCount = 0;
  
  formData.forEach(field => {
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
  });
  
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
    
    // Also check parent heading
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
  
  // Find all radio groups and match by question
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
          // Check if already selected
          const isSelected = radio.getAttribute('aria-checked') === 'true';
          if (!isSelected) {
            radio.click();
            // Wait a bit for Google Forms to process
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
  
  // Find checkbox group by question
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
        
        // Toggle if state doesn't match
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

// Helper: Set input value with proper event triggering
function setInputValue(element, value) {
  if (!element) return false;
  
  // Focus the element first
  element.focus();
  
  // Set the value
  element.value = value;
  
  // Trigger all necessary events untuk Google Forms validation
  const events = [
    new Event('input', { bubbles: true, cancelable: true }),
    new Event('change', { bubbles: true, cancelable: true }),
    new Event('blur', { bubbles: true, cancelable: true }),
    new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }),
    new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter' })
  ];
  
  events.forEach(event => {
    element.dispatchEvent(event);
  });
  
  // Blur to trigger validation
  element.blur();
  
  // Small delay to let Google Forms process
  setTimeout(() => {
    // Re-trigger input event after blur
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, 50);
  
  return true;
}

// Listen untuk message dari popup atau background
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
    try {
      const result = fillForm(request.data);
      sendResponse({ success: true, ...result });
    } catch (error) {
      console.error('Error filling form:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true; // Keep message channel open for async response
});

// Tambahkan button "Auto Fill" di halaman
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
        const fillResult = fillForm(result.savedFormData);
        
        button.innerHTML = `✅ Filled ${fillResult.filledCount} fields`;
        button.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
        
        setTimeout(() => {
          button.innerHTML = '⚡ Auto Fill';
          button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          button.disabled = false;
        }, 2000);
      } else {
        button.innerHTML = '❌ No saved data';
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

// Jalankan saat halaman selesai load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addAutoFillButton);
} else {
  addAutoFillButton();
}

// Re-add button jika halaman di-refresh via Google Forms navigation
const observer = new MutationObserver(() => {
  if (!document.getElementById('auto-fill-btn')) {
    addAutoFillButton();
  }
});

observer.observe(document.body, { childList: true, subtree: true });