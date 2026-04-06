# MindSync AI

Adaptive mental wellness coaching platform for high-performance individuals. MindSync uses AI to help users monitor cognitive load, manage stress, prevent burnout, and build sustainable mental performance habits.

---

## Overview

MindSync AI is a single-page web application built with Vite. It combines daily check-ins, AI coaching, performance analytics, and a curated protocol library into one interface. Authentication and data persistence are handled through Firebase.

The AI coach runs on Claude (Anthropic) as the primary provider, with Gemini (Google) as an automatic fallback if Claude is unavailable.

---

## Features

- **AI Coach** — Conversational coaching powered by Claude with streaming responses. Falls back to Gemini automatically on failure. Context-aware responses use the user's latest check-in data (sleep, stress, mood, burnout score).
- **Daily Check-in** — Log sleep hours, stress level, and mood each day. Data is synced to Firestore.
- **Dashboard** — Burnout gauge, cognitive load score, and at-a-glance status drawn from check-in history.
- **Insights** — Performance and baseline charts showing trends over 1 week, 2 weeks, or 1 month.
- **Protocol Library** — 12 guided wellness protocols across four categories: stress, focus, sleep, and memory. Includes box breathing, NSDR, power naps, neural priming, and more. Protocols can be saved and filtered.
- **Authentication** — Google sign-in via Firebase Auth. Email/password sign-in and registration also supported.
- **Demo Mode** — A set of demo credentials loads 35 days of pre-seeded sample data for exploring the app without an account.
- **Settings** — Update display name, view account email, delete account.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Build tool | Vite 5 |
| AI (primary) | Anthropic Claude via SDK |
| AI (fallback) | Google Gemini via `@google/generative-ai` |
| Auth and DB | Firebase 10 (Auth + Firestore) |
| Charts | Custom canvas rendering |
| Styling | Vanilla CSS with CSS variables |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Firebase project with Authentication and Firestore enabled
- An Anthropic API key
- A Google Gemini API key

### Installation

```bash
git clone <repo-url>
cd MindSync-AI
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
VITE_ANTHROPIC_API_KEY=your_anthropic_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Development

```bash
npm run dev
```

Starts a local dev server at `http://localhost:3000`. The Vite config proxies Claude API requests through `/api/claude` to avoid CORS issues in the browser.

### Production Build

```bash
npm run build
```

Output is written to `dist/`. Serve with any static host or run `npm run preview` to preview locally.

---

## Project Structure

```
src/
  auth.js          Login, signup, Google sign-in, logout, toast notifications
  checkin.js       Daily check-in modal and onboarding flow
  charts.js        Performance and baseline chart rendering
  coach.js         AI coach — Claude + Gemini, message history, fallback responses
  dashboard.js     Burnout gauge animation and dashboard metrics
  demo.js          Demo mode credentials and seed data
  firebase.js      Firebase app initialization
  main.js          Global event bindings and app bootstrap
  protocols.js     Protocol library data, filtering, modal, save/start logic
  router.js        Page navigation and transitions
  settings.js      Profile update and account deletion
  sync.js          Firestore sync for check-in data
  userState.js     User identity state helpers
  styles/
    layout.css     Sidebar, shell, and structural layout
    pages.css      Per-page component styles
index.html         Single HTML shell with all page markup
vite.config.js     Dev server proxy and build config
```

---

## Notes

- All user data is stored in `localStorage` and optionally synced to Firestore. No server-side processing occurs outside of Firebase.
- The Claude API key is used directly in the browser via a Vite dev proxy. For production, route requests through a backend to avoid exposing the key.
- Never commit `.env` to version control.
