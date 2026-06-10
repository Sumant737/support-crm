# SupportDesk CRM

A full-stack Customer Support Ticketing CRM system built with Node.js, Express, SQL.js, and React.

## Features

- **Create Tickets** — Customer name/email, subject, description, priority, auto-generated ID (TKT-XXXX) & timestamp
- **List All Tickets** — Clean table view with ID, name, subject, priority, status, and date
- **Search Functionality** — Real-time search across names, IDs, emails, and descriptions
- **Filter by Status** — Open, In Progress, Closed (with priority filter too)
- **View & Update Tickets** — Full detail view, status updates, inline editing, notes/comments
- **Analytics Dashboard** — Stats, charts by day/status/priority, resolution rate
- **Delete Tickets** — With confirmation step

## Tech Stack

- **Backend:** Node.js + Express + SQL.js (SQLite in-memory with file persistence)
- **Frontend:** React 18 + Vite + Lucide Icons
- **Styling:** Custom CSS design system (dark theme, responsive)
- **Database:** SQLite via sql.js (2 tables: tickets + notes)

## API Endpoints

```
POST   /api/tickets              Create a new ticket
GET    /api/tickets              List tickets (with ?search=, ?status=, ?priority=, ?sort=, ?order=)
GET    /api/tickets/stats        Dashboard statistics
GET    /api/tickets/:ticket_id   Get single ticket with notes
PUT    /api/tickets/:ticket_id   Update ticket status/fields + add notes
DELETE /api/tickets/:ticket_id   Delete a ticket
```

## Setup & Run

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd support-crm

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
npm run build
```

### Running Locally

```bash
# Start the backend (serves frontend too)
cd backend
node server.js
```

Visit `http://localhost:3001`

### Development Mode (hot reload frontend)

```bash
# Terminal 1: Start backend
cd backend
node server.js

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API calls to backend.

## Deployment (Railway)

1. Push to GitHub
2. Create new Railway project → Deploy from GitHub
3. Set root to `/backend`
4. Railway auto-detects Node.js and runs `npm start`
5. The backend serves the built frontend from `frontend/dist/`

Make sure to run `npm run build` in the frontend directory before deploying, or add a build step.

### Environment Variables

```bash
PORT=3001  # Optional, defaults to 3001
```

## Database Schema

```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,        -- e.g. TKT-0001
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Open',            -- Open | In Progress | Closed
  priority TEXT DEFAULT 'Medium',        -- Low | Medium | High
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,               -- FK to tickets.ticket_id
  note_text TEXT NOT NULL,
  author TEXT DEFAULT 'Support Agent',
  created_at TEXT NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
);
```

## Project Structure

```
support-crm/
├── backend/
│   ├── server.js          # Express API + SQL.js database
│   ├── crm.db             # SQLite database file (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root component, routing
│   │   ├── api.js              # API utility functions
│   │   ├── index.css           # Global design system styles
│   │   ├── components/
│   │   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   │   └── Badges.jsx      # Status/priority badges, date utils
│   │   ├── hooks/
│   │   │   └── useToast.jsx    # Toast notification system
│   │   └── pages/
│   │       ├── Dashboard.jsx   # Stats + recent tickets
│   │       ├── TicketsList.jsx # Full list with search/filter
│   │       ├── CreateTicket.jsx # New ticket form
│   │       ├── TicketDetail.jsx # Detail view + notes
│   │       └── Analytics.jsx   # Charts and analytics
│   ├── dist/              # Built frontend (gitignored)
│   └── package.json
└── README.md
```
## 🚀 Live Demo
https://support-crm-production-2037.up.railway.app/

## 🎥 Demo Video
https://drive.google.com/file/d/1bgRBrBfyducLM7asoILc1dzhlEHi67du/view?usp=sharing
