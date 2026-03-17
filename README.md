# 🌸 Nykaa BI Dashboard — Conversational AI Business Intelligence

> Ask questions in plain English. Get instant charts, SQL, and AI-powered insights from your Nykaa campaign data.

---

## 📁 Project Structure

```
nykaa-bi-dashboard/
├── backend/                        # Python FastAPI
│   ├── main.py                     # App entrypoint, CORS, lifespan
│   ├── requirements.txt
│   ├── .env.example
│   ├── render.yaml                 # Render deployment config
│   ├── models/
│   │   ├── __init__.py
│   │   ├── database.py             # SQLAlchemy models: User, Campaign, ChatHistory
│   │   └── schemas.py              # Pydantic request/response schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                 # /api/auth — register, login, me
│   │   ├── chat.py                 # /api/chat — NL→SQL→chart
│   │   ├── history.py              # /api/history — CRUD
│   │   └── export.py               # /api/export — CSV, PDF
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py         # JWT, bcrypt
│   │   ├── gemini_service.py       # Gemini NL→SQL + insights
│   │   └── query_service.py        # SQL safety + execution
│   └── scripts/
│       └── import_csv.py           # Import Nykaa CSV → PostgreSQL
│
└── frontend/                       # Next.js 14 App Router
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── postcss.config.js
    ├── vercel.json                  # Vercel deployment config
    ├── .env.local.example
    ├── app/
    │   ├── layout.tsx               # Root layout with fonts
    │   ├── globals.css              # Design tokens, utilities
    │   ├── page.tsx                 # Redirects to /landing
    │   ├── landing/
    │   │   └── page.tsx             # Public landing page
    │   ├── auth/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── dashboard/
    │       ├── layout.tsx           # Sidebar layout
    │       ├── page.tsx             # Chat interface
    │       ├── nanoid.ts            # ID helper
    │       ├── history/
    │       │   ├── page.tsx         # Query history list
    │       │   └── [id]/page.tsx    # History detail view
    │       └── insights/
    │           └── page.tsx         # Pre-built AI analyses
    ├── components/
    │   ├── charts/
    │   │   └── ChartRenderer.tsx    # Bar/Line/Pie/Area/Table
    │   ├── chat/
    │   │   ├── MessageBubble.tsx    # Chat message component
    │   │   ├── SqlViewer.tsx        # SQL syntax highlight
    │   │   └── InsightsPanel.tsx    # AI insights renderer
    │   └── ui/
    │       └── toaster.tsx          # Toast notifications
    ├── lib/
    │   ├── api.ts                   # Axios API client
    │   ├── auth.ts                  # JWT helpers
    │   └── utils.ts                 # cn() utility
    └── types/
        └── index.ts                 # TypeScript interfaces
```

---

## ⚙️ Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Python | 3.11+ |
| PostgreSQL | 14+ |
| Google Gemini API Key | [Get here](https://aistudio.google.com/app/apikey) |

---

## 🚀 Local Setup — Step by Step

### Step 1: Clone and enter project

```bash
git clone https://github.com/yourname/nykaa-bi-dashboard.git
cd nykaa-bi-dashboard
```

---

### Step 2: PostgreSQL Database Setup

#### Option A — Local PostgreSQL

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
psql -U postgres
CREATE DATABASE nykaa_bi;
CREATE USER nykaa_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE nykaa_bi TO nykaa_user;
\q
```

#### Option B — Supabase (Recommended for cloud)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose region closest to you (e.g. South Asia)
3. From **Settings → Database**, copy the **Connection String (URI)**
4. It looks like: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
5. Replace `postgresql://` with `postgresql+asyncpg://` for async usage

---

### Step 3: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql+asyncpg://nykaa_user:yourpassword@localhost:5432/nykaa_bi
SECRET_KEY=your-random-32-char-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=your-gemini-api-key-here
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
```

> **Generate SECRET_KEY**: Run `python -c "import secrets; print(secrets.token_hex(32))"`

---

### Step 4: Import the Nykaa Dataset

```bash
# Make sure virtual environment is active and .env is set
cd backend

python scripts/import_csv.py --file ../Nykaa_Digital_Marketing.csv
```

Expected output:
```
INFO  Reading CSV: ../Nykaa_Digital_Marketing.csv
INFO  Total rows: 1000
INFO  Imported 100 rows...
INFO  Imported 200 rows...
...
✅ Import complete: 1000 rows imported, 0 skipped
```

---

### Step 5: Start the Backend

```bash
# From backend/ directory with venv active
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running:
- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

---

### Step 6: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Step 7: Start the Frontend

```bash
npm run dev
```

Open: http://localhost:3000

---

### Step 8: First-Time Use

1. Go to http://localhost:3000 → **Get Started**
2. Register a new account
3. You're redirected to the dashboard
4. Try: `"Show top campaign types by revenue"`
5. AI converts it to SQL → runs query → shows chart + insights

---

## 🔑 Environment Variables Reference

### Backend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://user:pass@host/db` |
| `SECRET_KEY` | JWT signing key (32+ chars) | `abc123...` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL (7 days = 10080) | `10080` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |

### Frontend (`.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend base URL | `http://localhost:8000` |

---

## 🌐 Deployment

### Deploy Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel

# Follow prompts:
# - Link to project
# - Set environment variable: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

Or via Vercel Dashboard:
1. Push frontend to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Set root directory to `frontend`
4. Add env var: `NEXT_PUBLIC_API_URL` = your Render backend URL
5. Deploy

---

### Deploy Backend → Render

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: 3.11
5. Add environment variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `SECRET_KEY` | Your 32-char secret |
| `GEMINI_API_KEY` | Your Gemini key |
| `ENVIRONMENT` | `production` |
| `FRONTEND_URL` | Your Vercel app URL |

6. Deploy → Wait for green ✅

---

### Deploy Database → Supabase

1. [supabase.com](https://supabase.com) → New Project
2. Go to **SQL Editor** → Run tables will auto-create on first backend startup
3. After backend starts on Render, run the import script locally pointing to Supabase:

```bash
# In backend/.env, temporarily set DATABASE_URL to Supabase URL
python scripts/import_csv.py --file ../Nykaa_Digital_Marketing.csv
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt via passlib |
| Authentication | JWT Bearer tokens (7-day expiry) |
| SQL injection prevention | Whitelist: only SELECT queries allowed |
| Dangerous keyword blocking | INSERT, DROP, CREATE, etc. blocked |
| Table access control | Only `campaigns` table queryable |
| System table protection | `pg_`, `information_schema` blocked |
| CORS | Only allowed origins can call API |
| Query size limit | Max LIMIT 100 enforced automatically |

---

## 🧪 Sample Questions to Try

```
Show top 5 campaign types by total revenue
Which channel has the highest average ROI?
Compare clicks vs conversions by language
Show monthly revenue trend over time
What is the average acquisition cost by target audience?
Top 10 campaigns sorted by engagement score
Revenue distribution across customer segments (pie chart)
Which campaigns have ROI greater than 5?
Average duration by campaign type
Show campaigns with the most leads in April 2025
```

---

## 🛠 API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/query` | NL → SQL → chart + insights |
| GET | `/api/chat/suggestions` | Suggested questions |

### History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history/` | List user's history |
| GET | `/api/history/{id}` | Get history item |
| DELETE | `/api/history/{id}` | Delete history item |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/csv/{id}` | Download results as CSV |
| GET | `/api/export/pdf/{id}` | Download full PDF report |

Full interactive docs: `http://localhost:8000/docs`

---

## 🐛 Troubleshooting

**`asyncpg` connection refused**
→ Make sure PostgreSQL is running: `brew services start postgresql` or `sudo systemctl start postgresql`

**Gemini returns errors**
→ Check your `GEMINI_API_KEY` is valid and has quota. Free tier at [aistudio.google.com](https://aistudio.google.com)

**CSV import fails**
→ Ensure the column names in your CSV match the data dictionary. The script normalizes column names automatically.

**CORS errors in browser**
→ Update `FRONTEND_URL` in backend `.env` to match your exact frontend URL (no trailing slash)

**Charts not rendering**
→ `Chart.js` requires browser environment — ensure components are marked `"use client"` (already done)

**`tailwindcss-animate` not found**
→ Run: `npm install tailwindcss-animate` in the frontend directory

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS, custom CSS variables |
| Charts | Chart.js + react-chartjs-2 |
| Backend | Python FastAPI, async |
| Database | PostgreSQL (asyncpg + SQLAlchemy) |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT + bcrypt |
| Export | ReportLab (PDF), Python csv module |
| Deployment | Vercel (frontend) + Render (backend) + Supabase (DB) |

---


