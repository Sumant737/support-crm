import React, { useState } from 'react';
import { api } from '../api';
import { useToast } from '../hooks/useToast';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function CreateTicket({ setPage, setSelectedTicket }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
    priority: 'Medium',
  });

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.customer_name.trim()) e.customer_name = 'Name is required';
    if (!form.customer_email.trim()) e.customer_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.customer_email)) e.customer_email = 'Enter a valid email address';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.trim().length < 10) e.description = 'Please provide more detail (min 10 characters)';
    return e;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const result = await api.createTicket(form);
      setSuccess(result);
      toast('Ticket created successfully!', 'success');
    } catch (err) {
      toast(err.message || 'Failed to create ticket', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div>
        <div className="page-header">
          <div className="page-title-block">
            <div className="page-title">Ticket Created</div>
          </div>
        </div>
        <div className="page-content">
          <div className="form-card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{
              width: 64, height: 64, background: 'var(--green-dim)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <CheckCircle size={32} color="#22c55e" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Ticket Created Successfully
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Your support ticket has been created.
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600,
              color: 'var(--accent)', margin: '12px 0 24px', letterSpacing: 1,
            }}>
              {success.ticket_id}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => { setSelectedTicket(success.ticket_id); setPage('detail'); }}
              >
                View Ticket
              </button>
              <button className="btn btn-secondary" onClick={() => {
                setSuccess(null);
                setForm({ customer_name: '', customer_email: '', subject: '', description: '', priority: 'Medium' });
              }}>
                Create Another
              </button>
              <button className="btn btn-secondary" onClick={() => setPage('tickets')}>
                All Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <div className="page-title">New Support Ticket</div>
          <div className="page-subtitle">Fill in the customer details and issue description</div>
        </div>
      </div>

      <div className="page-content">
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={() => setPage('tickets')}>All Tickets</span>
          <span className="breadcrumb-sep">›</span>
          <span>New Ticket</span>
        </div>

        <form className="form-card" onSubmit={submit}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Customer Information
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                className={`form-input ${errors.customer_name ? 'error' : ''}`}
                type="text"
                placeholder="John Smith"
                value={form.customer_name}
                onChange={e => set('customer_name', e.target.value)}
              />
              {errors.customer_name && <div className="form-error">{errors.customer_name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Customer Email *</label>
              <input
                className={`form-input ${errors.customer_email ? 'error' : ''}`}
                type="email"
                placeholder="john@company.com"
                value={form.customer_email}
                onChange={e => set('customer_email', e.target.value)}
              />
              {errors.customer_email && <div className="form-error">{errors.customer_email}</div>}
            </div>
          </div>

          <div style={{ height: 20 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Issue Details
          </div>

          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">Subject *</label>
              <input
                className={`form-input ${errors.subject ? 'error' : ''}`}
                type="text"
                placeholder="Brief description of the issue"
                value={form.subject}
                onChange={e => set('subject', e.target.value)}
              />
              {errors.subject && <div className="form-error">{errors.subject}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="form-group full">
              <label className="form-label">Description *</label>
              <textarea
                className={`form-input form-textarea ${errors.description ? 'error' : ''}`}
                placeholder="Describe the issue in detail. Include any error messages, steps to reproduce, or relevant context..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Ticket'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setPage('tickets')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
