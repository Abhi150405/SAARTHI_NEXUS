# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SAARTHI Nexus is an AI-Powered Training and Placement Intelligence Platform. It's a full-stack application with:

- **Frontend**: React 19 + Vite + React Router DOM (HashRouter)
- **Backend**: Python FastAPI + Motor (async MongoDB driver)
- **Styling**: Tailwind CSS v4 + Vanilla CSS with CSS variables
- **Charts**: Recharts + Chart.js
- **Icons**: Lucide React

## Common Commands

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint

# Deploy to GitHub Pages
npm run deploy
```

### Backend Development

```bash
cd backend

# Setup Python virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Unix)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server (port 8000)
python run.py

# Or directly with uvicorn
uvicorn app.main:app --reload --port 8000
```

### Full Stack Development

Run frontend and backend simultaneously:
- Frontend: `npm run dev` → http://localhost:5173
- Backend: `python backend/run.py` → http://localhost:8000

## Architecture

### Frontend Structure

**Routing** (`src/App.jsx`):
- Uses `HashRouter` for GitHub Pages compatibility
- `/` - Landing page (public)
- `/login/student`, `/login/admin`, `/signup` - Auth pages
- `/admin/dashboard` - Admin dashboard (admin-only)
- `/app/*` - Main app routes with Layout sidebar
  - `/app/dashboard` - **Public** (no auth required)
  - `/app/skills`, `/app/eligibility`, etc. - Protected (student auth required)

**Key Directories**:
- `src/pages/` - Route-level page components
- `src/components/` - Reusable components
  - `src/components/landing/` - Landing page sections
- `src/styles/` - Component-specific CSS files
- `src/config.js` - API URL configuration (auto-detects local vs production)

**Authentication**:
- Client-side auth via `localStorage` (`isAuthenticated`, `user`)
- AuthGuard/AdminGuard components protect routes
- No JWT tokens - simple session-based approach

### Backend Structure

**Entry Point**: `backend/run.py` (uvicorn server)

**Key Directories**:
- `backend/app/api/endpoints/` - API route handlers (auth, profile, companies, stats, etc.)
- `backend/app/db/` - MongoDB connection and queries
- `backend/app/schemas/` - Pydantic models
- `backend/app/services/` - Business logic services
- `backend/app/llm/` - LLM/NVIDIA NIM integration
- `backend/app/agents/` - AI agent implementations

**API Pattern**:
- All routes mounted under `/api/*` prefix
- `backend/app/api/router.py` aggregates all endpoint modules

**Environment Variables** (backend/.env):
```
MONGODB_URI=
SECRET_KEY=
NVIDIA_NIM_API_KEY=
```

## Data Flow Patterns

### API Calls
All frontend API calls use the `API_URL` from `src/config.js`:
```javascript
import { API_URL } from '../config';
const response = await fetch(`${API_URL}/api/endpoint`);
```

### Backend Wake
`App.jsx` periodically pings `/health` to keep the backend awake (important for free-tier hosting).

## Styling Conventions

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **CSS Variables** defined in `src/index.css` for theming
- **Component CSS** in `src/styles/*.css` for complex components
- **Responsive design** with mobile-first approach
- **Dark theme only** (no light mode support)

## Database

MongoDB accessed via Motor (async driver). Key collections:
- `users` - Student and admin accounts
- `companies` - Placement records
- `experiences` - Student interview experiences
- `notifications` - System notifications
- `chats` - Chatbot conversation history
