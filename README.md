<div align="center">

# 💎 GemStone — RatnaGem Marketplace

**Sri Lanka's digital home for the Ratnapura gem trading community**

A modern web marketplace where verified buyers and sellers post gem listings, chat in real time, and trade with confidence.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://gemstone-eight.vercel.app)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

</div>

---

## ✨ About

**GemStone (RatnaGem)** is a full-stack gem marketplace web app built for Sri Lanka's Ratnapura gem trading community. Sellers list gemstones with photos and details, buyers browse and message sellers directly through an in-app chat, and admins moderate listings from a dedicated dashboard — all backed by Firebase.

## 🚀 Live Demo

👉 **[gemstone-eight.vercel.app](https://gemstone-eight.vercel.app)**

## 📸 Features

- 🔐 **Buyer & Seller Accounts** — secure Firebase Authentication with role-based access
- 💎 **Gem Ad Listings** — post, browse, and search gemstone listings with image galleries
- 💬 **In-App Chat** — real-time buyer ↔ seller messaging with unread badges
- 🛡️ **Admin Dashboard** — review, approve, and moderate listings and reports
- 🌗 **Light / Dark Theme** — polished UI with smooth theme switching
- 📱 **Fully Responsive** — optimized for mobile, tablet, and desktop

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 |
| Backend Services | Firebase (Authentication, Firestore, Storage) |
| AI | Google GenAI SDK |
| Containerization | Docker + Nginx |
| CI/CD | Jenkins → Vercel |
| Hosting | Vercel |

## 📦 Run Locally with Docker (Recommended)

The easiest way to run this project on **any machine** — no Node.js setup needed, just Docker.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

1. **Download / clone this repository**

   ```bash
   git clone https://github.com/Heshan01/GemStone.git
   cd GemStone
   ```

   > Or download the ZIP from GitHub (**Code → Download ZIP**) and extract it.

2. **Build and start the container**

   ```bash
   docker compose build
   docker compose up -d
   ```

3. **Open the app**

   Visit **[http://localhost:8080](http://localhost:8080)** in your browser. 🎉

4. **Stop the app**

   ```bash
   docker compose down
   ```

That's it — the app builds itself inside a container and serves via Nginx, with logs persisted in a Docker volume (`gemweb_logs`) so nothing is lost between restarts.

## 💻 Run Locally without Docker (Development Mode)

<details>
<summary>Click to expand</summary>

**Prerequisites:** Node.js 20+

```bash
git clone https://github.com/Heshan01/GemStone.git
cd GemStone
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

To create a production build:

```bash
npm run build
npm run preview
```

</details>

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and fill in your Gemini API key if you plan to use AI features:

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY="your-gemini-api-key"
```

> Firebase configuration is already bundled in `firebase-applet-config.json` — no extra setup needed for Auth/Firestore/Storage.

## 🔄 CI/CD Pipeline

Every push to `main` runs an automated Jenkins pipeline:

```
git push → Jenkins → npm lint → Docker build validation → Deploy to Vercel (production)
```

See [`Jenkinsfile`](./Jenkinsfile) for the full pipeline definition.

## 📁 Project Structure

```
GemStone/
├── src/
│   ├── components/     # Reusable UI components (Navbar, AdCard, Footer...)
│   ├── contexts/        # Auth & Theme context providers
│   ├── lib/              # Firebase config & DB initialization
│   ├── pages/            # App pages (Home, Browse, Chat, Admin, etc.)
│   └── App.tsx           # Root component & app router
├── Dockerfile             # Multi-stage build → Nginx production image
├── docker-compose.yml    # Local container orchestration + volume
├── nginx.conf            # Nginx SPA routing config
├── Jenkinsfile             # CI/CD pipeline definition
└── firestore.rules       # Firestore security rules
```

## 🤝 Contributing

Issues and pull requests are welcome! Feel free to fork the repo and submit improvements.

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
Made with 💎 for Sri Lanka's gem trading community
</div>