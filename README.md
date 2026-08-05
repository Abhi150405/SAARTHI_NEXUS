# SAARTHI NEXUS 🚀
> **Next-Generation Training & Placement Cell (TPO) Intelligence Platform**

SAARTHI NEXUS is an AI-powered, campus-wide placement management and career enablement platform. Built with a multi-agent RAG (Retrieval-Augmented Generation) AI architecture, real-time placement analytics, skill gap visualizers, resume ATS match scoring, interactive flight-board placement drives, and automated QR code attendance controls.

---

## 🌟 Key Features

### 🤖 Multi-Agent RAG AI Chatbot
- **4-Agent Pipeline**: Context Analyzer, Strategic Reasoner, Confidence Evaluator, and Markdown Formatter.
- **Fact-Grounded RAG**: Retrieves verified placement data, company criteria, and interview questions using ChromaDB vector search.
- **Resilient Fallback**: Automatic dual-engine router (Primary Groq LLM with instant Google Gemini fallback).

### 📊 Placement Analytics & TPO Control Center
- **TPO Admin Dashboard**: Live placement percentage, highest/average CTC metrics, branch-wise performance charts.
- **Company X-Ray**: Deep-dive intelligence modal for visiting recruiters, salary packages, historical trends, and required tech stacks.
- **Placement Offer Roster**: Complete database to manage online and offline student offer letters.

### 🎯 Student Career Enablement Tools
- **AI Skill Gap Visualizer**: Select target roles (Fullstack, Data Science, DevOps, Cloud) to compute missing skills and generate interactive learning roadmaps.
- **AI Resume Matcher**: Drag-and-drop PDF resume upload to compute ATS scores, missing keywords, extracted skills, projects, and key achievements.
- **Interview Experience Repository**: Peer-submitted interview write-ups organized by company, round type, and difficulty.
- **Interactive Eligibility Checker**: Instant eligibility breakdown based on student CGPA, backlogs, branch, and company criteria.
- **QR Code Attendance Control**: Real-time attendance logging for placement drive selection rounds with CSV roster export.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: Motor (Async MongoDB Client)
- **Vector Search**: ChromaDB (RAG Indexing)
- **AI Engine**: Groq API (`llama-3.1-8b-instant`) + Google Gemini (`gemini-2.5-flash`)
- **PDF & Text Processing**: PyPDF2, python-docx, TF-IDF Cosine Similarity

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Modern Vanilla CSS Design System with Glassmorphism
- **Icons & Animations**: Lucide React, Framer Motion
- **Charts & Data Viz**: Chart.js, React-Chartjs-2
- **Routing**: React Router DOM v6

---

## 📁 Repository Structure

```
SAARTHI_NEXUS/
├── backend/
│   ├── run.py                 # ASGI Server Launcher
│   ├── requirements.txt       # Python Dependencies
│   └── app/
│       ├── main.py            # FastAPI App & Lifecycle
│       ├── api/               # API Routes & Endpoints
│       ├── agents/            # Multi-Agent AI System
│       ├── llm/               # Groq / Gemini Dual Engine Router
│       ├── db/                # Async MongoDB Connection Pool
│       ├── services/          # RAG, VectorStore, Resume & Stats Services
│       └── schemas/           # Pydantic Schemas
├── frontend/
│   ├── package.json           # Frontend Dependencies
│   ├── vite.config.js         # Vite Configuration
│   └── src/
│       ├── App.jsx            # React Router Definition
│       ├── config.js          # API URL Config
│       ├── pages/             # Student & Admin Application Pages
│       ├── components/        # UI Components & Drive Panels
│       └── styles/            # Master CSS Design System Tokens
├── MODULE_SPECIFICATIONS.md   # Complete File-by-File Blueprint
└── .env.example               # Environment Variables Template
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18.0+
- **Python**: v3.10+
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

---

### 1. Environment Setup

Copy `.env.example` to `.env` in the root directory and update your configuration:

```bash
cp .env.example .env
```

Set your API keys:
```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_gemini_api_key
MONGO_URI=mongodb://localhost:27017/saarthi_nexus
VITE_API_URL=http://localhost:8000/api
```

---

### 2. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server
python run.py
```
*Backend API server will run at: `http://localhost:8000` (Swagger Docs: `http://localhost:8000/docs`)*

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend development server
npm run dev
```
*Frontend web application will run at: `http://localhost:5173`*

---

## 📄 Comprehensive Blueprint

For exhaustive file-by-file module specifications, input/output schemas, and Claude prompt blueprints, refer to **[MODULE_SPECIFICATIONS.md](MODULE_SPECIFICATIONS.md)**.

---

## 📜 License & Citation

Developed for SAARTHI NEXUS Training & Placement Intelligence System.
