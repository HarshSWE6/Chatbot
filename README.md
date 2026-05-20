---
title: TechNova AI Support Chatbot
emoji: 🤖
colorFrom: indigo
colorTo: cyan
sdk: docker
app_port: 7860
pinned: false
---

# 🤖 TechNova AI Support Chatbot

A professional AI-powered customer support chatbot built for **TechNova Electronics** — a fictional premium consumer electronics brand. Built as a full-stack portfolio project showcasing modern web development, UI/UX design, and AI integration.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **AI-Powered Responses** | Integrated with Google Gemini 2.0 Flash for intelligent, context-aware conversations |
| 🎙️ **Voice Input** | Speech-to-text using the Web Speech API — speak instead of typing |
| 🌗 **Dark / Light Theme** | Toggle between themes with smooth transitions, saved to localStorage |
| 🎨 **Glassmorphism UI** | Premium dark theme with frosted-glass panels, gradient accents, and animated particles |
| 📱 **Fully Responsive** | Mobile-first design with collapsible sidebar and touch-friendly interface |
| 💬 **Smart Fallback** | Works without an API key using keyword matching with context-aware follow-up handling |
| ⚡ **Fast & Lightweight** | ~200 lines of frontend JS, no frameworks, no build tools |

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.0 Flash API
- **Design:** CSS custom properties, glassmorphism, CSS animations
- **Voice:** Web Speech API (SpeechRecognition)
- **Deployment:** Docker (Hugging Face Spaces compatible)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Gemini API key](https://aistudio.google.com/apikey) (free, optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/technova-chatbot.git
cd technova-chatbot

# Install dependencies
npm install

# Start the server
npm run dev
```

Open **http://localhost:3000** in your browser.

### Enable AI Responses

```bash
# Set your free Gemini API key
# Windows PowerShell
$env:GEMINI_API_KEY="your-api-key-here"
npm run dev

# Linux / macOS
GEMINI_API_KEY=your-api-key-here npm run dev
```

> Without an API key, the chatbot runs in **fallback mode** with smart keyword matching — fully functional, just not as conversational.

---

## 📁 Project Structure

```
technova-chatbot/
├── server.js              # Express server + Gemini API proxy + fallback logic
├── public/
│   ├── index.html         # Clean semantic HTML
│   ├── index.css          # Dark glassmorphism theme + light mode
│   └── chatbot.js         # Chat UI, particles, voice, theme toggle
├── Dockerfile             # Docker config for deployment
├── package.json
└── README.md
```

---

## 🧠 How It Works

```
User Message
     │
     ▼
┌─────────────┐     ┌──────────────────┐
│  Frontend    │────▶│  POST /api/chat  │
│  chatbot.js  │     │  server.js       │
└─────────────┘     └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Gemini API Key?  │
                    └────────┬─────────┘
                        Yes  │  No
                   ┌─────────┴──────────┐
                   ▼                    ▼
          ┌────────────────┐  ┌─────────────────┐
          │ Gemini 2.0     │  │ Keyword Fallback │
          │ Flash API      │  │ + Context Memory │
          └────────────────┘  └─────────────────┘
                   │                    │
                   └─────────┬──────────┘
                             ▼
                      Bot Response
```

- **With API key:** Messages are sent to Gemini AI with a detailed system prompt containing all TechNova product data, policies, and personality instructions.
- **Without API key:** A server-side keyword matcher with word-boundary detection and context-aware follow-ups handles responses.

---

## 🎨 Design Highlights

- **Animated particle canvas** with connected dots (cyan + violet palette)
- **Frosted glass panels** using `backdrop-filter: blur()`
- **Gradient accents** — cyan → indigo → violet brand identity
- **Micro-animations** — message slide-in, floating welcome icon, typing indicator
- **Responsive sidebar** — full navigation on desktop, hamburger menu on mobile

---

## 🐳 Deployment

### Hugging Face Spaces

1. Create a new Space at [huggingface.co/new-space](https://huggingface.co/new-space) — select **Docker** SDK
2. Push this repo to the Space
3. Add `GEMINI_API_KEY` as a Secret in Space Settings (optional)

### Docker (Any Platform)

```bash
docker build -t technova-chatbot .
docker run -p 7860:7860 -e GEMINI_API_KEY=your-key technova-chatbot
```

### Railway / Render / Fly.io

This is a standard Node.js app — deploy as-is. Set `PORT` and `GEMINI_API_KEY` as environment variables.

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a message, get AI response |
| `GET` | `/api/status` | Check if AI is enabled |
| `GET` | `/api/health` | Server health check |

### POST /api/chat

```json
{
  "message": "What phones do you sell?",
  "history": [
    { "role": "user", "text": "Hi" },
    { "role": "bot", "text": "Hello! How can I help?" }
  ]
}
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">
  Built with ❤️ as a portfolio project
</p>
