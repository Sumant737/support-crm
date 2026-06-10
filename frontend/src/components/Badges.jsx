import React from 'react';

export function StatusBadge({ status }) {
  const map = {
    'Open': 'badge-open',
    'In Progress': 'badge-in-progress',
    'Closed': 'badge-closed',
  };
  return (
    <span className={`badge ${map[status] || 'badge-open'}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    'High': 'badge-high',
    'Medium': 'badge-medium',
    'Low': 'badge-low',
  };
  return (
    <span className={`badge ${map[priority] || 'badge-medium'}`}>
      {priority}
    </span>
  );
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
