import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../hooks/useToast';
import { StatusBadge, PriorityBadge, formatDateTime, timeAgo } from '../components/Badges';
import { ArrowLeft, Mail, Clock, Hash, Edit2, Trash2, MessageSquare, Send } from 'lucide-react';

const STATUSES = ['Open', 'In Progress', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function TicketDetail({ ticketId, setPage, onDelete }) {
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('Support Agent');
  const [savingNote, setSavingNote] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data);
      setEditForm({ status: data.status, priority: data.priority, subject: data.subject, description: data.description });
    } catch (e) {
      toast('Failed to load ticket', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [ticketId]);

  async function updateStatus(newStatus) {
    try {
      await api.updateTicket(ticketId, { status: newStatus });
      setTicket(t => ({ ...t, status: newStatus }));
      toast(`Status updated to "${newStatus}"`, 'success');
    } catch (e) {
      toast('Failed to update status', 'error');
    }
  }

  async function saveEdit() {
    setSaving(true);
    try {
      await api.updateTicket(ticketId, editForm);
      setTicket(t => ({ ...t, ...editForm }));
      setEditMode(false);
      toast('Ticket updated', 'success');
    } catch (e) {
      toast('Failed to update ticket', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.updateTicket(ticketId, { note_text: noteText, author: noteAuthor });
      setNoteText('');
      await load();
      toast('Note added', 'success');
    } catch (e) {
      toast('Failed to add note', 'error');
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteTicket() {
    setDeleting(true);
    try {
      await api.deleteTicket(ticketId);
      toast('Ticket deleted', 'info');
      setPage('tickets');
      if (onDelete) onDelete();
    } catch (e) {
      toast('Failed to delete ticket', 'error');
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="loading-state"><div className="spinner" />Loading ticket…</div>;
  }

  if (!ticket) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-title">Ticket not found</div>
          <button className="btn btn-primary" onClick={() => setPage('tickets')}>Back to Tickets</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost" onClick={() => setPage('tickets')} style={{ padding: '6px 8px' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="page-title" style={{ fontFamily: 'var(--font-mono)', fontSize: 18 }}>{ticket.ticket_id}</div>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div className="page-subtitle">{ticket.subject}</div>
          </div>
        </div>
        <div style={{ paddingBottom: 20, display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setEditMode(!editMode)}>
            <Edit2 size={13} /> {editMode ? 'Cancel' : 'Edit'}
          </button>
          {!confirmDelete ? (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} /> Delete
            </button>
          ) : (
            <>
              <button className="btn btn-danger" onClick={deleteTicket} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={() => setPage('tickets')}>All Tickets</span>
          <span className="breadcrumb-sep">›</span>
          <span>{ticket.ticket_id}</span>
        </div>

        <div className="detail-layout">
          {/* Main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Customer info */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Customer Information</div>
              </div>
              <div className="detail-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="detail-section">
                    <div className="detail-field-label">Name</div>
                    <div className="detail-field-value">{ticket.customer_name}</div>
                  </div>
                  <div className="detail-section">
                    <div className="detail-field-label">Email</div>
                    <div className="detail-field-value">
                      <a href={`mailto:${ticket.customer_email}`} className="detail-email" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Mail size={13} /> {ticket.customer_email}
                      </a>
                    </div>
                  </div>
                  <div className="detail-section">
                    <div className="detail-field-label"><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />Created</div>
                    <div className="detail-field-value" style={{ fontSize: 13 }}>{formatDateTime(ticket.created_at)}</div>
                  </div>
                  <div className="detail-section">
                    <div className="detail-field-label">Last Updated</div>
                    <div className="detail-field-value" style={{ fontSize: 13 }}>{timeAgo(ticket.updated_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Details */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Issue Details</div>
                {!editMode && (
                  <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditMode(true)}>
                    <Edit2 size={12} /> Edit
                  </button>
                )}
              </div>
              <div className="detail-card-body">
                {editMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input
                        className="form-input"
                        value={editForm.subject}
                        onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select className="form-select" value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}>
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-input form-textarea"
                        value={editForm.description}
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="detail-section">
                      <div className="detail-field-label">Description</div>
                      <div className="detail-description">{ticket.description}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: 6 }} />
                  Notes & Activity ({ticket.notes?.length || 0})
                </div>
              </div>
              <div className="detail-card-body">
                <div className="notes-list">
                  {(ticket.notes || []).length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                      No notes yet. Add the first note below.
                    </div>
                  )}
                  {(ticket.notes || []).map(note => (
                    <div className="note-item" key={note.id}>
                      <div className="note-header">
                        <span className="note-author">{note.author}</span>
                        <span className="note-date">{formatDateTime(note.created_at)}</span>
                      </div>
                      <div className="note-text">{note.note_text}</div>
                    </div>
                  ))}
                </div>

                <div className="note-form" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      className="form-input"
                      style={{ fontSize: 13, padding: '7px 12px' }}
                      placeholder="Your name"
                      value={noteAuthor}
                      onChange={e => setNoteAuthor(e.target.value)}
                    />
                  </div>
                  <textarea
                    placeholder="Write a note or comment about this ticket…"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) addNote(); }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={addNote}
                    disabled={savingNote || !noteText.trim()}
                    style={{ fontSize: 13 }}
                  >
                    <Send size={13} />
                    {savingNote ? 'Adding…' : 'Add Note'}
                    <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>(Ctrl+Enter)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick Status */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Update Status</div>
              </div>
              <div className="detail-card-body">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    className={`status-option ${ticket.status === s ? 'selected' : ''}`}
                    onClick={() => updateStatus(s)}
                  >
                    <StatusBadge status={s} />
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Meta */}
            <div className="detail-card">
              <div className="detail-card-header">
                <div className="detail-card-title">Details</div>
              </div>
              <div className="detail-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div className="detail-field-label">Ticket ID</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', marginTop: 4 }}>{ticket.ticket_id}</div>
                </div>
                <div>
                  <div className="detail-field-label">Status</div>
                  <div style={{ marginTop: 4 }}><StatusBadge status={ticket.status} /></div>
                </div>
                <div>
                  <div className="detail-field-label">Priority</div>
                  <div style={{ marginTop: 4 }}><PriorityBadge priority={ticket.priority} /></div>
                </div>
                <div>
                  <div className="detail-field-label">Created</div>
                  <div className="detail-field-value" style={{ fontSize: 12, marginTop: 4 }}>{formatDateTime(ticket.created_at)}</div>
                </div>
                <div>
                  <div className="detail-field-label">Updated</div>
                  <div className="detail-field-value" style={{ fontSize: 12, marginTop: 4 }}>{formatDateTime(ticket.updated_at)}</div>
                </div>
                <div>
                  <div className="detail-field-label">Notes</div>
                  <div className="detail-field-value" style={{ marginTop: 4 }}>{ticket.notes?.length || 0} note{ticket.notes?.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
