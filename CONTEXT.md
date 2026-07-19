# Project Context: Google Forms Auto-Fill Chrome Extension

## 📌 1. Project Overview
**Google Forms Auto-Fill** is a Chrome Extension built with Manifest V3 and Vanilla JavaScript. Its primary purpose is to automate the process of filling out Google Forms by detecting form fields, saving user inputs to Chrome Local Storage, and automatically injecting those values into identical or similar forms in the future.

## 🏗️ 2. Tech Stack & Architecture
- **Environment:** Chrome Extension (Manifest V3)
- **Language:** Vanilla JavaScript (ES6+), HTML, CSS
- **Storage:** `chrome.storage.local` for persisting form data
- **Permissions:** `storage`, `activeTab`, `scripting`
- **Host Permissions:** `https://docs.google.com/forms/*`

### Architectural Components
1. **Popup (`/popup`)**: The user interface of the extension. It manages interactions like detecting fields, saving data, and triggering the fill action. It communicates with the content script via `chrome.tabs.sendMessage`.
2. **Content Script (`/content`)**: Runs directly on the Google Forms web page. It handles DOM manipulation, detecting form elements, extracting current values, and filling inputs.
3. **Background Script (`/background`)**: The service worker. Currently minimal, primarily serving as the backbone for Manifest V3 requirements.
4. **Shared Utilities (`/shared`, `/utils`)**: Reusable modules for storage management, constants (selectors, field types), and logging.

## 📂 3. Directory Structure
```text
.
├── background/         # Service worker scripts
├── content/            # Injected scripts for Google Forms page
│   ├── field-detectors/# Classes to identify and extract data from specific field types
│   ├── field-fillers/  # Classes to inject data into specific field types
│   ├── utils/          # DOM and Event helper functions
│   └── content.js      # Main entry point for the content script
├── icons/              # Extension icons (16, 48, 128px)
├── popup/              # UI for the extension toolbar action
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── shared/             # Code shared across popup and content scripts
│   ├── constants.js    # Enums, CSS selectors, and configurations
│   └── storage-helper.js # Wrapper for chrome.storage API
├── utils/              # General utilities (e.g., logger)
├── manifest.json       # Extension configuration
└── README.md
```

## ⚙️ 4. Core Workflows
1. **Detection Phase (`detectFields`)**: 
   - User clicks "Detect" in the popup.
   - Content script initializes various `Detector` classes (e.g., `TextDetector`, `RadioDetector`).
   - Detectors scan the DOM using selectors defined in `constants.js` and extract the question label, field type, and current value.
2. **Saving Phase (`saveFormData`)**:
   - The popup aggregates the detected fields (and any user edits from the popup UI).
   - The data is sent to the content script, which uses `StorageHelper` to merge and save the array of field objects into `chrome.storage.local`.
3. **Filling Phase (`fillForm`)**:
   - User clicks "Fill".
   - Popup retrieves saved data from storage and sends it to the content script.
   - Content script initializes `Filler` classes (e.g., `TextFiller`, `RadioFiller`) to map the saved data back into the form's DOM elements, simulating user interaction where necessary (e.g., triggering change events).

## 📝 5. Supported Field Types
The extension currently supports a wide range of Google Forms inputs:
- Text (`text`)
- Paragraph / Textarea (`textarea`)
- Multiple Choice (`radio`)
- Checkboxes (`checkbox`)
- Dropdown (`dropdown`)
- Date (`date`)
- Time (`time`)
- Multiple Choice Grid (`radio_grid`)
- Checkbox Grid (`checkbox_grid`)

## 🎯 6. Developer Notes & Guidelines
- **DOM Dependency**: Google Forms dynamically generates its DOM with obfuscated classes (e.g., `[jsname="V68bde"]`). The extension relies heavily on the `SELECTORS` defined in `shared/constants.js`. If Google updates their DOM structure, these selectors will need to be updated.
- **Event Simulation**: Google Forms uses internal state management (likely React or similar). Simply setting `input.value` is often insufficient; synthetic events (like `input`, `change`, `click`, or keyboard events) must be dispatched to register the changes properly.
- **Modularity**: The project strictly follows Object-Oriented principles for detectors and fillers. Any new field type support must be implemented by creating a new `*Detector.js` and `*Filler.js` class and registering them in `content.js`.
