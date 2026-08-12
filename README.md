# Zoom Clone — Full Stack Web Application

A functional, visually accurate Zoom clone built with Next.js, FastAPI, and SQLite.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router, TypeScript) |
| **Backend** | Python FastAPI |
| **Database** | SQLite via SQLAlchemy ORM |
| **Styling** | Vanilla CSS (Zoom dark theme) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-seeds database on first run)
uvicorn main:app --reload --port 8000
```

The backend will be available at **http://localhost:8000**  
API docs: **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at **http://localhost:3000**

---

## ✅ Features

### Core (Required)
- **Landing Dashboard** — Zoom-style dark UI with sidebar navigation, time display, upcoming/recent meetings
- **Instant Meeting** — One-click meeting creation with unique ID (XXX-XXXX-XXXX format)
- **Join Meeting** — Join by Meeting ID with display name
- **Schedule Meetings** — Full form with date/time picker, duration, auto-generated link
- **Meeting Room** — Simulated video grid, mute/camera controls, participants panel, live chat

### Bonus
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Host controls (mute/remove participants via API)
- ✅ Live meeting chat
- ✅ Elapsed meeting timer
- ✅ Toast notifications

---

## 🗃️ Database Schema

### `meetings`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| meeting_id | VARCHAR(12) | Unique Zoom-style ID (e.g. 123-4567-8901) |
| title | VARCHAR | Meeting title |
| description | TEXT | Optional description |
| host_name | VARCHAR | Host display name |
| status | VARCHAR | `scheduled` / `active` / `ended` |
| scheduled_at | DATETIME | Scheduled start time |
| duration_minutes | INTEGER | Meeting duration |
| invite_link | VARCHAR | Full shareable URL |
| created_at | DATETIME | Creation timestamp |
| ended_at | DATETIME | End timestamp (nullable) |

### `participants`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| meeting_db_id | FK → meetings.id | Parent meeting |
| display_name | VARCHAR | Participant name |
| joined_at | DATETIME | Join timestamp |
| left_at | DATETIME | Leave timestamp (nullable) |
| is_host | BOOLEAN | Whether host |
| is_muted | BOOLEAN | Mute state |
| is_video_on | BOOLEAN | Camera state |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/meetings` | List all meetings |
| POST | `/api/meetings` | Create instant meeting |
| POST | `/api/meetings/schedule` | Schedule meeting |
| GET | `/api/meetings/upcoming` | Upcoming meetings |
| GET | `/api/meetings/recent` | Recent meetings |
| GET | `/api/meetings/{id}` | Get meeting details |
| POST | `/api/meetings/{id}/join` | Join meeting |
| POST | `/api/meetings/{id}/leave` | Leave meeting |
| DELETE | `/api/meetings/{id}/end` | End meeting |
| GET | `/api/participants/{id}` | Get active participants |
| PATCH | `/api/participants/{id}/mute` | Toggle mute |
| DELETE | `/api/participants/{id}/remove` | Remove participant |

---

## 💡 Assumptions Made

1. **No authentication** — Default user is "Saransh Singh" (logged in by default)
2. **Simulated video** — Real WebRTC requires TURN servers; meeting room uses avatar tiles
3. **Chat is local** — Chat messages are in-memory (no WebSocket persistence)
4. **Participant polling** — Participants list refreshes every 5 seconds
5. **Database seeded** — 7 sample meetings (3 ended, 4 upcoming) are auto-seeded on first run

---

## 📁 Project Structure

```
zoom-clone/
├── backend/
│   ├── main.py              # FastAPI app + CORS + auto-seed
│   ├── database.py          # SQLAlchemy setup
│   ├── models.py            # ORM models
│   ├── schemas.py           # Pydantic schemas
│   ├── seed.py              # Sample data seeder
│   ├── requirements.txt
│   └── routers/
│       ├── meetings.py      # Meeting CRUD endpoints
│       └── participants.py  # Participant management
│
└── frontend/
    ├── app/
    │   ├── page.tsx              # Dashboard
    │   ├── join/page.tsx         # Join Meeting
    │   ├── schedule/page.tsx     # Schedule Meeting
    │   └── meeting/[id]/page.tsx # Meeting Room
    ├── components/
    │   ├── Navbar.tsx
    │   ├── MeetingCard.tsx
    │   ├── MeetingControls.tsx
    │   └── VideoGrid.tsx
    ├── lib/
    │   └── api.ts               # Typed API client
    └── .env.local               # API URL config
```

---

## 👨‍💻 Author

**Saransh Singh** — Scaler SDE Fullstack Assignment
