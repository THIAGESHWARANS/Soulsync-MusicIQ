# SoulSync — Audience to Music AI
### Complete Project (Phases 1–6)

A platform where fans share emotions and AI generates songs — lyrics via GPT-4o, beats via Suno AI or Replicate MusicGen.

---

## Project Structure

```
soulsync-full/
├── README.md
├── server/                        ← Node.js + Express backend
│   ├── index.js                   ← Entry point
│   ├── package.json
│   ├── .env.example               ← Copy to .env
│   ├── middleware/
│   │   ├── rateLimiter.js         ← API + AI rate limiting
│   │   ├── errorHandler.js        ← Global error handler
│   │   └── auth.js                ← Firebase token verification
│   ├── services/
│   │   ├── firebase.js            ← Firestore + Auth Admin SDK
│   │   ├── openai.js              ← GPT-4o lyrics engine (Phase 5)
│   │   └── beatService.js         ← Suno + Replicate beat engine (Phase 6)
│   ├── controllers/
│   │   ├── authController.js      ← Register/login/profile (Phase 2)
│   │   ├── emotionsController.js  ← Mood submission (Phase 3)
│   │   ├── trendsController.js    ← Trend aggregation (Phase 4)
│   │   ├── lyricsController.js    ← Lyrics generation (Phase 5)
│   │   └── beatController.js      ← Beat generation (Phase 6)
│   └── routes/
│       ├── auth.js
│       ├── emotions.js
│       ├── trends.js
│       ├── lyrics.js
│       └── beats.js
│
└── client/                        ← React + Vite frontend
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── main.jsx               ← App entry + router
        ├── context/
        │   └── AuthContext.jsx    ← Firebase auth state (Phase 2)
        ├── hooks/
        │   └── useAuth.js         ← Auth hook
        ├── services/
        │   ├── api.js             ← All backend fetch calls
        │   └── firebase.js        ← Firebase client SDK init
        ├── components/
        │   ├── Nav.jsx            ← Navigation bar
        │   ├── ProtectedRoute.jsx ← Route guard (Phase 2)
        │   └── BeatPlayer.jsx     ← Audio player (Phase 6)
        └── pages/
            ├── HomePage.jsx       ← Trends + community feed (Phase 4)
            ├── LoginPage.jsx      ← Login (Phase 2)
            ├── SignupPage.jsx     ← Signup (Phase 2)
            ├── CreatePage.jsx     ← Mood submission (Phase 3)
            ├── GeneratePage.jsx   ← AI lyrics + beat (Phase 5+6)
            └── DashboardPage.jsx  ← Artist dashboard (Phase 8)
```

---

## Quick Start (5 minutes)

### 1. Firebase Setup
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project → Enable **Authentication** → Enable **Email/Password**
3. Create a **Firestore Database** (start in test mode)
4. Project Settings → **Service Accounts** → Generate private key → download JSON
5. Project Settings → **General** → scroll to "Your apps" → Add Web app → copy config

### 2. Backend

```bash
cd server
cp .env.example .env
# Fill in .env with Firebase service account + OpenAI + Suno/Replicate keys
npm install
npm run dev        # Starts on http://localhost:5000
```

### 3. Frontend

```bash
cd client
cp .env.example .env
# Fill in .env with Firebase web config
npm install
npm run dev        # Starts on http://localhost:5173
```

---

## Environment Variables

### server/.env
```
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Firebase Admin (from downloaded service account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI (Phase 5 — lyrics)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Suno AI (Phase 6 — beats, option A)
SUNO_API_KEY=

# Replicate (Phase 6 — beats, option B fallback)
REPLICATE_API_TOKEN=
```

### client/.env
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

VITE_API_URL=http://localhost:5000/api
```

---

## Firestore Collections

| Collection | Description |
|---|---|
| `users` | userId, name, email, role (fan/artist), createdAt |
| `emotions` | userId, mood, text, language, timestamp |
| `songs` | title, lyrics, metadata, mood, language, style, likes, createdAt |
| `beats` | provider, audioUrl, model, prompt, mood, plays, likes, createdAt |

---

## API Endpoints

| Method | Path | Phase | Description |
|---|---|---|---|
| POST | /api/auth/register | 2 | Create account |
| POST | /api/auth/login | 2 | Verify token + return profile |
| GET | /api/auth/me | 2 | Get current user profile |
| POST | /api/emotions | 3 | Submit mood |
| GET | /api/emotions/mine | 3 | User's own moods |
| GET | /api/trends | 4 | Aggregated mood %s (last 24h) |
| POST | /api/lyrics/generate | 5 | AI lyrics generation |
| GET | /api/lyrics/top | 5 | Top songs by likes |
| GET | /api/lyrics/:id | 5 | Fetch song |
| POST | /api/beats/generate | 6 | AI beat generation |
| GET | /api/beats/top | 6 | Top beats by plays |
| GET | /api/beats/:id | 6 | Fetch beat |

---

## Deployment

**Frontend → Vercel**
```bash
cd client && npm run build
# Push to GitHub → connect to Vercel → set env vars → deploy
```

**Backend → Railway**
```bash
# Push to GitHub → new Railway project → connect repo
# Set all server env vars in Railway dashboard
# Railway auto-detects Node and runs npm start
```
