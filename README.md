<div align="center">

# 💎 GemStone — RatnaGem Marketplace

**Sri Lanka's digital home for the Ratnapura gem trading community.**
<br/>
*A production-ready marketplace where verified buyers and sellers post gem listings, chat in real-time, and trade with confidence.*

[![Live Demo](https://img.shields.io/badge/Live_Portal-Operational-brightgreen?style=for-the-badge)](https://your-domain.com)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)

</div>

---

## ✨ About The Project

**GemStone (RatnaGem)** is a full-stack, real-world e-commerce marketplace architected specifically for Sri Lanka's Gem City, Ratnapura. The platform bridges the gap between traditional gem trading and digital commerce. 

Backed by a robust CI/CD pipeline, Docker containerization, and a Serverless Firebase backend, GemStone is built for scalability, security, and high performance.

## 🚀 Live Production Environment

👉 **[Access the GemStone Portal Here](https://your-domain.com)**

*(Deployed globally via Vercel Edge Network)*

## 📸 Key Features

- 🔐 **Role-Based Authentication** — Secure Buyer, Seller, and Admin access levels via Firebase Auth.
- 💎 **Dynamic Gem Listings** — Sellers can post, edit, and manage gemstone advertisements with high-resolution image galleries.
- 💬 **Real-Time Messaging** — Integrated in-app chat bridging buyers and sellers instantly.
- 🛡️ **Admin Governance Dashboard** — Centralized hub for moderating listings, managing users, and handling reports.
- 🌗 **Adaptive UI** — Seamless Light/Dark theme switching with a fully responsive, mobile-first design.
- 🤖 **AI Integration Ready** — Configured with Google GenAI SDK for future automated gem analysis and descriptions.

## 🛠️ System Architecture & Tech Stack

| Component | Technology Used |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 6 |
| **UI/UX Styling** | Tailwind CSS v4 |
| **Backend & Database** | Firebase (Auth, Firestore NoSQL, Cloud Storage) |
| **Containerization** | Docker, Nginx (Alpine) |
| **CI/CD Automation** | Jenkins Pipeline (Native Windows execution) |
| **Production Hosting** | Vercel (Custom Domain, Auto SSL) |

## 🔄 CI/CD Pipeline Workflow

The project utilizes a continuous integration and deployment model. Every code push to the `main` branch triggers an automated Jenkins pipeline:

1. **Source Checkout** from GitHub.
2. **NPM Installation & Linting** to ensure code quality.
3. **Vercel CLI Integration** via secure environment variables.
4. **Production Deployment** directly to the Vercel edge network.

## 📦 Local Development Setup

### Method 1: Using Docker (Recommended for exact environment matching)

*Prerequisite: [Docker Desktop](https://www.docker.com/products/docker-desktop/) must be running.*

```bash
# 1. Clone the repository
git clone [https://github.com/Heshan01/GemStone.git](https://github.com/Heshan01/GemStone.git)
cd GemStone

# 2. Build and spin up the container
docker compose build
docker compose up -d