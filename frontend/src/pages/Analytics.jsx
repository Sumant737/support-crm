import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { BarChart2, TrendingUp, Users, Clock } from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, t] = await Promise.all([api.getStats(), api.getTickets({})]);
        setStats(s);
        setTickets(t.tickets || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner" />Loading analytics…</div>;
  if (!stats) return null;

  const resolutionRate = stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;

  // Group by day (last 7)
  const byDay = {};
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    byDay[key] = 0;
  }
  tickets.forEach(t => {
    const d = new Date(t.created_at);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (byDay[key] !== undefined) byDay[key]++;
  });

  const maxDay = Math.max(...Object.values(byDay), 1);

  // Group by status
  const statusCounts = { Open: stats.open, 'In Progress': stats.inProgress, Closed: stats.closed };
  const statusColors = { Open: '#3b82f6', 'In Progress': '#f59e0b', Closed: '#22c55e' };

  // Group by priority
  const priorityCounts = { High: 0, Medium: 0, Low: 0 };
  tickets.forEach(t => { if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });

  return (
    <div>
      <div className="page-header">
        <div className="page-title-block">
          <div className="page-title">Analytics</div>
          <div className="page-subtitle">Support team performance overview</div>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-row" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Tickets', value: stats.total, icon: BarChart2, color: '#6c63ff', bg: 'rgba(108,99,255,0.15)' },
            { label: 'Resolution Rate', value: `${resolutionRate}%`, icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
            { label: 'Open Tickets', value: stats.open, icon: Clock, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
            { label: 'High Priority Open', value: stats.highPriority, icon: Users, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div className="stat-card" key={label}>
              <div className="stat-header">
                <div className="stat-label">{label}</div>
                <div className="stat-icon" style={{ background: bg }}><Icon size={16} color={color} /></div>
              </div>
              <div className="stat-value">{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
          {/* Tickets by day */}
          <div className="detail-card">
            <div className="detail-card-header"><div className="detail-card-title">Tickets Created — Last 7 Days</div></div>
            <div className="detail-card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
                {Object.entries(byDay).map(([day, count]) => (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{count || ''}</div>
                    <div style={{
                      width: '100%', background: count > 0 ? 'var(--accent)' : 'var(--border)',
                      borderRadius: '4px 4px 0 0',
                      height: `${Math.max((count / maxDay) * 100, count > 0 ? 8 : 2)}px`,
                      transition: 'height 0.3s ease',
                      opacity: count > 0 ? 1 : 0.3,
                    }} />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', transform: 'rotate(-30deg)', transformOrigin: 'top center', marginTop: 4 }}>{day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="detail-card">
            <div className="detail-card-header"><div className="detail-card-title">By Status</div></div>
            <div className="detail-card-body">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{status}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                      background: statusColors[status],
                      borderRadius: 3,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="detail-card">
          <div className="detail-card-header"><div className="detail-card-title">By Priority</div></div>
          <div className="detail-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'High', count: priorityCounts.High, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
                { label: 'Medium', count: priorityCounts.Medium, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
                { label: 'Low', count: priorityCounts.Low, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} style={{ background: bg, border: `1px solid ${color}33`, borderRadius: 10, padding: '18px 22px' }}>
                  <div style={{ fontSize: 12, color, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label} Priority</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color, letterSpacing: -1 }}>{count}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}% of total
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
