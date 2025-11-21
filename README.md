# Carbon Based AI-Detector  
A browser-based extension for detecting AI-generated **images** and **audio** using free open-source models.  
This tool helps users quickly analyze files or media they encounter online and determine whether they were produced by artificial intelligence.

🔗 **Live Demo / Popup UI:**  
https://newethicdesign.github.io/ai-detector/popup.html

---

## 🚀 What Is Carbon Based AI-Detector?

Carbon Based AI-Detector is a lightweight, open-source web extension that uses free AI-detection APIs hosted on **Hugging Face** to analyze:

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
2. Click the Carbon Based AI-Detector icon in your toolbar.  
3. Upload an **image** or **audio file**.  
4. Click **Analyze**.  
5. View AI-generation probability results.

---

## 🛠️ Installing the Extension (Developer Mode)

### **Chrome / Edge**
1. Download or clone the repository:  
   ```bash
   git clone https://github.com/YOUR-USERNAME/ai-detector.git
