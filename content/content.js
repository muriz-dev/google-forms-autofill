// content/content.js

console.log('Google Forms Auto-Fill: Content script loaded');

// Fungsi untuk mendapatkan semua field di form
function getFormFields() {
  const fields = [];
  
  // Text inputs (Short answer)
  const textInputs = document.querySelectorAll('input[type="text"]');
  textInputs.forEach((input, index) => {
    const questionDiv = input.closest('[role="listitem"]');
    const questionText = questionDiv ? questionDiv.querySelector('[role="heading"]')?.innerText : '';
    
    fields.push({
      type: 'text',
      question: questionText || `Text Input ${index + 1}`,
      selector: generateSelector(input),
      value: ''
    });
  });
  
  // Textarea (Paragraph)
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach((textarea, index) => {
    const questionDiv = textarea.closest('[role="listitem"]');
    const questionText = questionDiv ? questionDiv.querySelector('[role="heading"]')?.innerText : '';
    
    fields.push({
      type: 'textarea',
      question: questionText || `Paragraph ${index + 1}`,
      selector: generateSelector(textarea),
      value: ''
    });
  });
  
  // Radio buttons (Multiple choice)
  const radioGroups = document.querySelectorAll('[role="radiogroup"]');
  radioGroups.forEach((group, index) => {
    const questionDiv = group.closest('[role="listitem"]');
    const questionText = questionDiv ? questionDiv.querySelector('[role="heading"]')?.innerText : '';
    
    const options = [];
    group.querySelectorAll('[role="radio"]').forEach(radio => {
      options.push(radio.getAttribute('aria-label') || radio.innerText);
    });
    
    fields.push({
      type: 'radio',
      question: questionText || `Multiple Choice ${index + 1}`,
      selector: generateSelector(group),
      options: options,
      value: ''
    });
  });
  
  // Checkboxes
  const checkboxGroups = document.querySelectorAll('[role="group"]');
  checkboxGroups.forEach((group, index) => {
    // Filter hanya yang punya checkbox
    const checkboxes = group.querySelectorAll('[role="checkbox"]');
    if (checkboxes.length === 0) return;
    
    const questionDiv = group.closest('[role="listitem"]');
    const questionText = questionDiv ? questionDiv.querySelector('[role="heading"]')?.innerText : '';
    
    const options = [];
    checkboxes.forEach(checkbox => {
      options.push(checkbox.getAttribute('aria-label') || checkbox.innerText);
    });
    
    fields.push({
      type: 'checkbox',
      question: questionText || `Checkboxes ${index + 1}`,
      selector: generateSelector(group),
      options: options,
      value: []
    });
  });
  
  return fields;
}

// Generate unique selector untuk setiap element
function generateSelector(element) {
  // Gunakan data-params atau aria-label sebagai identifier
  const dataParams = element.getAttribute('data-params');
  if (dataParams) {
    return `[data-params="${dataParams}"]`;
  }
  
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return `[aria-label="${ariaLabel}"]`;
  }
  
  // Fallback: gunakan position dalam parent
  const parent = element.parentElement;
  const siblings = Array.from(parent.children);
  const index = siblings.indexOf(element);
  
  return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
}

// Fungsi untuk fill form dengan data yang tersimpan
function fillForm(formData) {
  formData.forEach(field => {
    try {
      switch(field.type) {
        case 'text':
        case 'textarea':
          fillTextInput(field);
          break;
        case 'radio':
          fillRadioButton(field);
          break;
        case 'checkbox':
          fillCheckbox(field);
          break;
      }
    } catch(error) {
      console.error(`Error filling field: ${field.question}`, error);
    }
  });
}

function fillTextInput(field) {
  const element = document.querySelector(field.selector);
  if (element && field.value) {
    element.value = field.value;
    // Trigger input event agar Google Forms detect perubahan
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function fillRadioButton(field) {
  const group = document.querySelector(field.selector);
  if (!group || !field.value) return;
  
  const radios = group.querySelectorAll('[role="radio"]');
  radios.forEach(radio => {
    const label = radio.getAttribute('aria-label') || radio.innerText;
    if (label === field.value) {
      radio.click();
    }
  });
}

function fillCheckbox(field) {
  const group = document.querySelector(field.selector);
  if (!group || !field.value || field.value.length === 0) return;
  
  const checkboxes = group.querySelectorAll('[role="checkbox"]');
  checkboxes.forEach(checkbox => {
    const label = checkbox.getAttribute('aria-label') || checkbox.innerText;
    const isChecked = checkbox.getAttribute('aria-checked') === 'true';
    const shouldBeChecked = field.value.includes(label);
    
    // Klik jika state tidak sesuai
    if (isChecked !== shouldBeChecked) {
      checkbox.click();
    }
  });
}

// Listen untuk message dari popup atau background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFields') {
    const fields = getFormFields();
    sendResponse({ fields: fields });
  }
  
  if (request.action === 'fillForm') {
    fillForm(request.data);
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Tambahkan button "Auto Fill" di halaman (optional, untuk UX lebih baik)
function addAutoFillButton() {
  // Cek apakah button sudah ada
  if (document.getElementById('auto-fill-btn')) return;
  
  const button = document.createElement('button');
  button.id = 'auto-fill-btn';
  button.innerText = '⚡ Auto Fill';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    padding: 10px 20px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  button.addEventListener('click', () => {
    // Request data dari storage lalu fill
    chrome.storage.local.get(['savedFormData'], (result) => {
      if (result.savedFormData) {
        fillForm(result.savedFormData);
        alert('Form filled successfully!');
      } else {
        alert('No saved data found. Please save data first from extension popup.');
      }
    });
  });
  
  document.body.appendChild(button);
}

// Jalankan saat halaman selesai load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addAutoFillButton);
} else {
  addAutoFillButton();
}