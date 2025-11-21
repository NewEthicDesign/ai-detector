# Non-carbon Based AI-Detector  
A browser-based extension for detecting AI-generated **images** and **audio** using free open-source models.  
This tool helps users quickly analyze files or media they encounter online and determine whether they were produced by artificial intelligence.

🔗 **Live Demo / Popup UI:**  
https://newethicdesign.github.io/ai-detector/popup.html

---

## 🚀 What Is Non-carbon Based AI-Detector?

Non-carbon Based AI-Detector is a lightweight, open-source web extension that uses free AI-detection APIs hosted on **Hugging Face** to analyze:

- 🖼 **Images**  
- 🎵 **Audio / Music files**

It provides a summarized confidence score (human-made vs AI-generated) and optional advanced model outputs.  
Developers can easily extend the extension to add new providers, new models, or alternative APIs.

---

## 🧠 How It Works

The extension sends the selected media file to a detection API endpoint.  
Results returned by the model may include:

- AI probability score  
- Human probability score  
- Classification labels  
- Model confidence metrics  

By default, the tool uses **free Hugging Face inference endpoints**, but users may add their own API keys or custom host permissions.

---

## 🎮 How to Use (For Users)

1. Install the web extension from your browser’s developer mode (instructions below).  
2. Click the Non-carbon Based AI-Detector icon in your toolbar.  
3. Upload an **image** or **audio file**.  
4. Click **Analyze**.  
5. View AI-generation probability results.

---

## 🛠️ Installing the Extension (Developer Mode)

### **Chrome / Edge**
1. Download or clone the repository:  
   ```bash
   git clone https://github.com/YOUR-USERNAME/ai-detector.git

   Open chrome://extensions/

2. Enable Developer Mode (toggle in top right).
3. Click Load unpacked.
4. Select the project folder.

Firefox
1. Open about:debugging#/runtime/this-firefox
2. Click Load Temporary Add-on
3. Select the manifest.json inside the project folder.

⚡ Features
- Detect AI-generated images
- Detect AI-generated audio / music
- Works offline except for API calls
- API-agnostic (you can add more detection services)
- Lightweight, fast popup UI
- Free to use and modify
- BSD-3 License (open-source friendly)

Extending the Tool (Developers)
You can easily add more host permissions to support more detection models.
Example (in manifest.json):

"host_permissions": [
  "https://*.huggingface.co/*",
  "https://your-custom-ai-endpoint.com/*"
]

To add your own API key or endpoint, modify:
- /scripts/detect-image.js
- /scripts/detect-audio.js
- /scripts/config.js
This tool is designed to be fully pluggable.

API Usage (Hugging Face)
This extension uses the free Hugging Face inference API.
You may replace the public endpoints with a private key for more reliable throughput:

const HF_KEY = "hf_XXXXXXXXXXXXXXXXXXXXXXXX";
Or add an .env flow if integrating a backend server.

🛡️ License
Copyright (c) 2025, <copyright holder>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.

🙌 Credits
Created by New Ethic Design

Demo
Try the popup interface directly:
👉 https://newethicdesign.github.io/ai-detector/popup.html



