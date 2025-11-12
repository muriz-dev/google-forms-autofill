# Google Forms Auto-Fill Extension

Chrome extension untuk mengisi Google Forms secara otomatis dengan data yang tersimpan.

## Features (MVP)

- 🚧 Deteksi field di Google Forms (text, textarea, radio, checkbox)
- 🚧 Save form data ke Chrome Storage (in progress)
- 🚧 Auto-fill dengan satu klik (in progress)
- 🚧 Manage saved data via popup UI (planned)

## Tech Stack

- Vanilla JavaScript
- Chrome Extension Manifest V3
- Chrome Storage API

## Installation (Development)

1. Clone repository ini
```bash
git clone https://github.com/username/google-forms-autofill.git
cd google-forms-autofill
```

2. Buka Chrome dan navigasi ke `chrome://extensions/`

3. Enable "Developer mode" (toggle di kanan atas)

4. Klik "Load unpacked"

5. Pilih folder project ini

6. Extension akan muncul di toolbar Chrome

## Usage

1. Buka Google Forms apapun
2. Klik button "⚡ Auto Fill" yang muncul di kanan atas halaman
3. (Future) Atau klik icon extension untuk manage data

## Project Structure
```
google-forms-autofill/
├── manifest.json           # Extension configuration
├── content/
│   └── content.js         # Script yang berjalan di Google Forms pages (coming soon)
├── popup/                 # Extension popup UI (coming soon)
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/            # Background service worker (coming soon)
│   └── background.js
├── icons/                 # Extension icons (placeholder)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── utils/                 # Helper utilities (coming soon)
    └── storage.js
```

## Development Progress

- [x] Step 1: Project setup & manifest configuration
- [ ] Step 2: Content script untuk deteksi & fill form fields
- [ ] Step 3: Popup UI untuk manage data
- [ ] Step 4: Storage management
- [ ] Step 5: Advanced features (multiple profiles, import/export)

## Known Issues

- Belum support dropdown select
- Selector generation perlu improvement untuk form yang kompleks

## Contributing

Project ini sedang dalam tahap development awal. Contributions welcome!

## License

MIT License

---

**Author:** Muriz
**Created:** November 2025
```

#### 1.3 Buat placeholder icons

Karena belum ada icon, kita buat placeholder sederhana. Buat file `icons/placeholder-icon.txt`:
```
# Placeholder Icons

Untuk sementara, download icon placeholder dari:
- https://via.placeholder.com/16x16.png → simpan sebagai icon16.png
- https://via.placeholder.com/48x48.png → simpan sebagai icon48.png
- https://via.placeholder.com/128x128.png → simpan sebagai icon128.png

Atau gunakan icon generator online seperti:
- https://www.favicon-generator.org/
- https://favicon.io/