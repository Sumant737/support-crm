import React, { useEffect, useState } from 'react';
import { Ticket, AlertCircle, Clock, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { StatusBadge, PriorityBadge, timeAgo } from '../components/Badges';

export default function Dashboard({ setPage, setSelectedTicket }) {
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, closed: 0, highPriority: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, ticketsData] = await Promise.all([
          api.getStats(),
          api.getTickets({ sort: 'created_at', order: 'desc' }),
        ]);
        setStats(statsData);
        setRecentTickets((ticketsData.tickets || []).slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: Ticket, color: '#6c63ff', bg: 'rgba(108,99,255,0.15)', meta: 'All time' },
    { label: 'Open', value: stats.open, icon: AlertCircle, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', meta: 'Needs attention' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', meta: 'Being handled' },
    { label: 'Resolved', value: stats.closed, icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.15)', meta: 'Closed tickets' },
  ];

  function openTicket(t) {
    setSelectedTicket(t.ticket_id);
    setPage('detail');
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your support operations</div>
        </div>
        <div style={{ paddingBottom: 20 }}>
          <button className="btn btn-primary" onClick={() => setPage('create')}>
            <span>+</span> New Ticket
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-row">
          {statCards.map(({ label, value, icon: Icon, color, bg, meta }) => (
            <div className="stat-card" key={label}>
              <div className="stat-header">
                <div className="stat-label">{label}</div>
                <div className="stat-icon" style={{ background: bg }}>
                  <Icon size={16} color={color} />
                </div>
              </div>
              <div className="stat-value">{value}</div>
              <div className="stat-meta">{meta}</div>
            </div>
          ))}
        </div>

        {stats.highPriority > 0 && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
            fontSize: 13,
            color: '#ef4444',
            fontWeight: 500,
          }}>
            <AlertCircle size={16} />
            {stats.highPriority} high-priority ticket{stats.highPriority !== 1 ? 's' : ''} need immediate attention
            <button
              className="btn-ghost"
              style={{ marginLeft: 'auto', color: '#ef4444', fontSize: 12 }}
              onClick={() => setPage('tickets')}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Tickets</div>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => setPage('tickets')}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        <div className="tickets-table">
          <div className="table-header">
            <div className="table-header-cell">Ticket ID</div>
            <div className="table-header-cell">Subject</div>
            <div className="table-header-cell">Customer</div>
            <div className="table-header-cell">Priority</div>
            <div className="table-header-cell">Status</div>
            <div className="table-header-cell">Created</div>
          </div>
          {recentTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Ticket size={24} color="var(--text-muted)" /></div>
              <div className="empty-title">No tickets yet</div>
              <div className="empty-desc">Create your first ticket to get started</div>
              <button className="btn btn-primary" onClick={() => setPage('create')}>Create Ticket</button>
            </div>
          ) : recentTickets.map(t => (
            <div className="ticket-row" key={t.ticket_id} onClick={() => openTicket(t)}>
              <div className="ticket-id">{t.ticket_id}</div>
              <div className="ticket-subject">{t.subject}</div>
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
