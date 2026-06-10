import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Ticket, Filter, RefreshCw, ArrowUpDown } from 'lucide-react';
import { api } from '../api';
import { StatusBadge, PriorityBadge, timeAgo } from '../components/Badges';

const STATUS_OPTIONS = ['All', 'Open', 'In Progress', 'Closed'];
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'];

export default function TicketsList({ setPage, setSelectedTicket }) {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const searchTimeout = useRef(null);

  const load = useCallback(async (q, s, p, srt, ord) => {
    setLoading(true);
    try {
      const data = await api.getTickets({ search: q, status: s, priority: p, sort: srt, order: ord });
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => load(search, status, priority, sort, order), 300);
  }, [search, status, priority, sort, order, load]);

  function openTicket(id) {
    setSelectedTicket(id);
    setPage('detail');
  }

  function toggleSort(col) {
    if (sort === col) setOrder(o => o === 'desc' ? 'asc' : 'desc');
    else { setSort(col); setOrder('desc'); }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <div className="page-title">All Tickets</div>
          <div className="page-subtitle">{total} ticket{total !== 1 ? 's' : ''} total</div>
        </div>
        <div style={{ paddingBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setPage('create')}>+ New Ticket</button>
        </div>
      </div>

      <div className="page-content">
        {/* Filter bar */}
        <div className="toolbar">
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, ID, email, subject…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>

          <select className="filter-select" value={priority} onChange={e => setPriority(e.target.value)}>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
          </select>

          <button
            className="btn btn-secondary"
            onClick={() => load(search, status, priority, sort, order)}
            style={{ padding: '9px 12px' }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Active filters */}
        {(status !== 'All' || priority !== 'All' || search) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filters:</span>
            {search && (
              <span className="badge badge-open" style={{ cursor: 'pointer' }} onClick={() => setSearch('')}>
                Search: "{search}" ×
              </span>
            )}
            {status !== 'All' && (
              <span className="badge badge-open" style={{ cursor: 'pointer' }} onClick={() => setStatus('All')}>
                Status: {status} ×
              </span>
            )}
            {priority !== 'All' && (
              <span className="badge badge-open" style={{ cursor: 'pointer' }} onClick={() => setPriority('All')}>
                Priority: {priority} ×
              </span>
            )}
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: '2px 8px' }}
              onClick={() => { setSearch(''); setStatus('All'); setPriority('All'); }}
            >
              Clear all
            </button>
          </div>
        )}

        <div className="tickets-table">
          <div className="table-header">
            <div className="table-header-cell" style={{ cursor: 'pointer' }} onClick={() => toggleSort('ticket_id')}>
              Ticket ID {sort === 'ticket_id' ? (order === 'desc' ? '↓' : '↑') : ''}
            </div>
            <div className="table-header-cell">Subject</div>
            <div className="table-header-cell" style={{ cursor: 'pointer' }} onClick={() => toggleSort('customer_name')}>
              Customer {sort === 'customer_name' ? (order === 'desc' ? '↓' : '↑') : ''}
            </div>
            <div className="table-header-cell">Priority</div>
            <div className="table-header-cell">Status</div>
            <div className="table-header-cell" style={{ cursor: 'pointer' }} onClick={() => toggleSort('created_at')}>
              Created {sort === 'created_at' ? (order === 'desc' ? '↓' : '↑') : ''}
            </div>
          </div>

          {loading ? (
            <div className="loading-state"><div className="spinner" /> Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Ticket size={24} color="var(--text-muted)" /></div>
              <div className="empty-title">No tickets found</div>
              <div className="empty-desc">
                {search || status !== 'All' || priority !== 'All'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first support ticket'}
              </div>
              {!search && status === 'All' && (
                <button className="btn btn-primary" onClick={() => setPage('create')}>Create Ticket</button>
              )}
            </div>
          ) : tickets.map(t => (
            <div className="ticket-row" key={t.ticket_id} onClick={() => openTicket(t.ticket_id)}>
              <div className="ticket-id">{t.ticket_id}</div>
              <div>
                <div className="ticket-subject">{t.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.customer_email}</div>
              </div>
              <div className="ticket-customer">{t.customer_name}</div>
              <div><PriorityBadge priority={t.priority} /></div>
              <div><StatusBadge status={t.status} /></div>
              <div className="ticket-date">{timeAgo(t.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
