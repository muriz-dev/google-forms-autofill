// popup/popup.js - FIXED VERSION

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Popup error:', event.error);
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Storage helper
const StorageHelper = {
  async get(key) {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key];
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },

  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },

  async remove(key) {
    try {
      await chrome.storage.local.remove([key]);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  }
};

// State management
let detectedFields = [];
let currentTab = null;

// DOM Elements
const detectBtn = document.getElementById('detect-btn');
const fillBtn = document.getElementById('fill-btn');
const saveBtn = document.getElementById('save-btn');
const clearBtn = document.getElementById('clear-btn');
const statusMessage = document.getElementById('status-message');
const statusBox = document.querySelector('.status-box');
const fieldsContainer = document.getElementById('fields-container');
const fieldsList = document.getElementById('fields-list');
const savedStatus = document.getElementById('saved-status');
const savedPreview = document.getElementById('saved-preview');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadSavedData();
    setupEventListeners();
    await checkCurrentTab();
  } catch (error) {
    console.error('Initialization error:', error);
    showStatus('⚠️ Extension failed to initialize. Please reload.', 'error');
  }
});

// Setup event listeners
function setupEventListeners() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  detectBtn.addEventListener('click', detectFields);
  fillBtn.addEventListener('click', fillForm);
  saveBtn.addEventListener('click', saveData);
  clearBtn.addEventListener('click', clearSavedData);

  document.getElementById('github-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/YOUR_USERNAME/google-forms-autofill' });
  });
}

// Switch tabs
function switchTab(tabName) {
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });

  if (tabName === 'saved') {
    loadSavedData();
  }
}

// Check if current tab is Google Forms
async function checkCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    if (!tab.url || !tab.url.includes('docs.google.com/forms')) {
      showStatus('⚠️ Please open a Google Forms page to use this extension', 'error');
      detectBtn.disabled = true;
      fillBtn.disabled = true;
    }
  } catch (error) {
    console.error('Error checking current tab:', error);
  }
}

// Detect fields from current form
async function detectFields() {
  try {
    showStatus('🔍 Detecting form fields...', 'info');
    detectBtn.disabled = true;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'getFields' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('❌ Error: Could not connect to the page. Try refreshing the form.', 'error');
        detectBtn.disabled = false;
        return;
      }

      if (response && response.fields && response.fields.length > 0) {
        detectedFields = response.fields;
        displayFields(response.fields);
        showStatus(`✅ Detected ${response.fields.length} fields successfully`, 'success');
        fillBtn.disabled = false;
      } else {
        showStatus('⚠️ No fields detected. Make sure you\'re on a Google Forms page.', 'error');
      }

      detectBtn.disabled = false;
    });
  } catch (error) {
    console.error('Error detecting fields:', error);
    showStatus('❌ An error occurred while detecting fields', 'error');
    detectBtn.disabled = false;
  }
}

// Display detected fields in UI
function displayFields(fields) {
  fieldsList.innerHTML = '';

  fields.forEach((field, index) => {
    const fieldItem = createFieldInput(field, index);
    fieldsList.appendChild(fieldItem);
  });

  fieldsContainer.style.display = 'block';
}

// Create input element based on field type
function createFieldInput(field, index) {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'field-item';

  const label = document.createElement('label');
  label.className = 'field-label';
  label.innerHTML = `${field.question} <span class="field-type">(${field.type})</span>`;
  fieldDiv.appendChild(label);

  let inputElement;

  switch (field.type) {
    case 'text':
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.className = 'field-input';
      inputElement.placeholder = 'Enter value...';
      inputElement.value = field.value || '';
      inputElement.dataset.index = index;
      break;

    case 'textarea':
      inputElement = document.createElement('textarea');
      inputElement.className = 'field-textarea';
      inputElement.placeholder = 'Enter text...';
      inputElement.value = field.value || '';
      inputElement.dataset.index = index;
      break;

    case 'radio':
      inputElement = document.createElement('div');
      inputElement.className = 'options-group';
      field.options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `radio-${index}`;
        radio.value = option;
        radio.id = `radio-${index}-${option}`;
        radio.checked = field.value === option;
        radio.dataset.index = index;

        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = radio.id;
        optionLabel.textContent = option;

        optionDiv.appendChild(radio);
        optionDiv.appendChild(optionLabel);
        inputElement.appendChild(optionDiv);
      });
      break;

    case 'checkbox':
      inputElement = document.createElement('div');
      inputElement.className = 'options-group';
      field.options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option;
        checkbox.id = `checkbox-${index}-${option}`;
        checkbox.checked = field.value && field.value.includes(option);
        checkbox.dataset.index = index;

        const optionLabel = document.createElement('label');
        optionLabel.htmlFor = checkbox.id;
        optionLabel.textContent = option;

        optionDiv.appendChild(checkbox);
        optionDiv.appendChild(optionLabel);
        inputElement.appendChild(optionDiv);
      });
      break;
  }

  fieldDiv.appendChild(inputElement);
  return fieldDiv;
}

// Save data to Chrome Storage
async function saveData() {
  try {
    const updatedFields = detectedFields.map((field, index) => {
      const fieldCopy = { ...field };

      if (field.type === 'text' || field.type === 'textarea') {
        const input = document.querySelector(`[data-index="${index}"]`);
        fieldCopy.value = input ? input.value : '';
      } else if (field.type === 'radio') {
        const selected = document.querySelector(`input[name="radio-${index}"]:checked`);
        fieldCopy.value = selected ? selected.value : '';
      } else if (field.type === 'checkbox') {
        const checkboxes = document.querySelectorAll(`input[type="checkbox"][data-index="${index}"]:checked`);
        fieldCopy.value = Array.from(checkboxes).map(cb => cb.value);
      }

      return fieldCopy;
    });

    const success = await StorageHelper.set('savedFormData', updatedFields);

    if (success) {
      showStatus('✅ Data saved successfully!', 'success');
      await loadSavedData();
    } else {
      showStatus('❌ Failed to save data', 'error');
    }
  } catch (error) {
    console.error('Error saving data:', error);
    showStatus('❌ Failed to save data', 'error');
  }
}

// Fill form with saved data
async function fillForm() {
  try {
    const savedData = await StorageHelper.get('savedFormData');

    if (!savedData || !Array.isArray(savedData) || savedData.length === 0) {
      showStatus('⚠️ No saved data found. Please save data first.', 'error');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'fillForm',
      data: savedData
    }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('❌ Error: Could not connect to the page', 'error');
        return;
      }

      if (response && response.success) {
        const { filledCount, errorCount } = response;
        
        if (errorCount > 0) {
          showStatus(`⚠️ Filled ${filledCount}/${filledCount + errorCount} fields (${errorCount} errors)`, 'error');
        } else {
          showStatus(`✅ All ${filledCount} fields filled successfully!`, 'success');
        }
      }
    });
  } catch (error) {
    console.error('Error filling form:', error);
    showStatus('❌ Failed to fill form', 'error');
  }
}

// Load and display saved data
async function loadSavedData() {
  try {
    const savedData = await StorageHelper.get('savedFormData');

    if (savedData && Array.isArray(savedData) && savedData.length > 0) {
      savedStatus.textContent = `You have saved data for ${savedData.length} fields`;
      clearBtn.style.display = 'block';

      savedPreview.innerHTML = '';
      
      savedData.forEach(field => {
        if (!field || !field.question) {
          console.warn('Invalid field data:', field);
          return;
        }

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'saved-field';

        const question = document.createElement('div');
        question.className = 'saved-field-question';
        question.textContent = field.question;

        const value = document.createElement('div');
        value.className = 'saved-field-value';

        if (Array.isArray(field.value)) {
          value.textContent = field.value.length > 0 ? field.value.join(', ') : '(empty)';
        } else if (field.value !== undefined && field.value !== null) {
          value.textContent = field.value.toString() || '(empty)';
        } else {
          value.textContent = '(empty)';
        }

        fieldDiv.appendChild(question);
        fieldDiv.appendChild(value);
        savedPreview.appendChild(fieldDiv);
      });

      savedPreview.classList.add('show');
      
    } else {
      savedStatus.textContent = 'No saved data yet';
      clearBtn.style.display = 'none';
      savedPreview.innerHTML = '';
      savedPreview.classList.remove('show');
    }
    
  } catch (error) {
    console.error('Error loading saved data:', error);
    savedStatus.textContent = 'Error loading saved data';
    clearBtn.style.display = 'none';
    savedPreview.classList.remove('show');
  }
}

// Clear saved data
async function clearSavedData() {
  if (!confirm('Are you sure you want to clear all saved data?')) {
    return;
  }

  try {
    const success = await StorageHelper.remove('savedFormData');
    
    if (success) {
      // Reset UI state
      detectedFields = [];
      fieldsContainer.style.display = 'none';
      fieldsList.innerHTML = '';
      fillBtn.disabled = true;
      
      // Update saved data display
      savedStatus.textContent = 'No saved data yet';
      clearBtn.style.display = 'none';
      savedPreview.innerHTML = '';
      savedPreview.classList.remove('show');
      
      showStatus('🗑️ Saved data cleared successfully', 'success');
    } else {
      showStatus('❌ Failed to clear data', 'error');
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    showStatus('❌ Failed to clear data', 'error');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusBox.className = 'status-box';

  if (type === 'success') {
    statusBox.classList.add('success');
  } else if (type === 'error') {
    statusBox.classList.add('error');
  }
}