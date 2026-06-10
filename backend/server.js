const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'crm.db');

app.use(cors());
app.use(express.json());

// Serve frontend static files in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

let db;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      priority TEXT DEFAULT 'Medium',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      note_text TEXT NOT NULL,
      author TEXT DEFAULT 'Support Agent',
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
    )
  `);

  saveDB();
  console.log('Database initialized');
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function generateTicketId() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM tickets');
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  const count = (row.count || 0) + 1;
  return `TKT-${String(count).padStart(4, '0')}`;
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function dbGet(sql, params = []) {
  const rows = dbAll(sql, params);
  return rows[0] || null;
}

function dbRun(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

// ── POST /api/tickets ──────────────────────────────────────────────────────
app.post('/api/tickets', (req, res) => {
  try {
    const { customer_name, customer_email, subject, description, priority } = req.body;

    if (!customer_name || !customer_email || !subject || !description) {
      return res.status(400).json({ error: 'Missing required fields: customer_name, customer_email, subject, description' });
    }

    const ticket_id = generateTicketId();
    const now = new Date().toISOString();

    dbRun(
      `INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, status, priority, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?)`,
      [ticket_id, customer_name.trim(), customer_email.trim(), subject.trim(), description.trim(), priority || 'Medium', now, now]
    );

    return res.status(201).json({ ticket_id, created_at: now, message: 'Ticket created successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// ── GET /api/tickets ───────────────────────────────────────────────────────
app.get('/api/tickets', (req, res) => {
  try {
    const { status, search, priority, sort = 'created_at', order = 'desc' } = req.query;

    let sql = 'SELECT ticket_id, customer_name, customer_email, subject, status, priority, created_at, updated_at FROM tickets WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (priority && priority !== 'All') {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    if (search) {
      sql += ' AND (customer_name LIKE ? OR customer_email LIKE ? OR ticket_id LIKE ? OR subject LIKE ? OR description LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q, q, q);
    }

    const validSortCols = ['created_at', 'updated_at', 'customer_name', 'status'];
    const sortCol = validSortCols.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortCol} ${sortOrder}`;

    const tickets = dbAll(sql, params);
    return res.json({ tickets, total: tickets.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// ── GET /api/tickets/stats ─────────────────────────────────────────────────
app.get('/api/tickets/stats', (req, res) => {
  try {
    const total = dbGet('SELECT COUNT(*) as count FROM tickets')?.count || 0;
    const open = dbGet("SELECT COUNT(*) as count FROM tickets WHERE status = 'Open'")?.count || 0;
    const inProgress = dbGet("SELECT COUNT(*) as count FROM tickets WHERE status = 'In Progress'")?.count || 0;
    const closed = dbGet("SELECT COUNT(*) as count FROM tickets WHERE status = 'Closed'")?.count || 0;
    const highPriority = dbGet("SELECT COUNT(*) as count FROM tickets WHERE priority = 'High' AND status != 'Closed'")?.count || 0;

    return res.json({ total, open, inProgress, closed, highPriority });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── GET /api/tickets/:ticket_id ────────────────────────────────────────────
app.get('/api/tickets/:ticket_id', (req, res) => {
  try {
    const { ticket_id } = req.params;
    const ticket = dbGet('SELECT * FROM tickets WHERE ticket_id = ?', [ticket_id]);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const notes = dbAll('SELECT * FROM notes WHERE ticket_id = ? ORDER BY created_at ASC', [ticket_id]);
    return res.json({ ...ticket, notes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// ── PUT /api/tickets/:ticket_id ────────────────────────────────────────────
app.put('/api/tickets/:ticket_id', (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { status, note_text, author, priority, subject, description } = req.body;

    const ticket = dbGet('SELECT * FROM tickets WHERE ticket_id = ?', [ticket_id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (priority) { updates.push('priority = ?'); params.push(priority); }
    if (subject) { updates.push('subject = ?'); params.push(subject); }
    if (description) { updates.push('description = ?'); params.push(description); }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(ticket_id);

    if (updates.length > 1) {
      dbRun(`UPDATE tickets SET ${updates.join(', ')} WHERE ticket_id = ?`, params);
    }

    if (note_text && note_text.trim()) {
      dbRun(
        'INSERT INTO notes (ticket_id, note_text, author, created_at) VALUES (?, ?, ?, ?)',
        [ticket_id, note_text.trim(), author || 'Support Agent', now]
      );
    }

    return res.json({ success: true, updated_at: now });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// ── DELETE /api/tickets/:ticket_id ─────────────────────────────────────────
app.delete('/api/tickets/:ticket_id', (req, res) => {
  try {
    const { ticket_id } = req.params;
    const ticket = dbGet('SELECT * FROM tickets WHERE ticket_id = ?', [ticket_id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    dbRun('DELETE FROM notes WHERE ticket_id = ?', [ticket_id]);
    dbRun('DELETE FROM tickets WHERE ticket_id = ?', [ticket_id]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ message: 'Support CRM API running. Frontend not built yet.' });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Support CRM server running on http://localhost:${PORT}`);
  });
});
