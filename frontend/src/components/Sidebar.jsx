import React from 'react';
import { LayoutDashboard, Ticket, PlusCircle, BarChart2, Headphones } from 'lucide-react';

export default function Sidebar({ page, setPage, openCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'All Tickets', icon: Ticket, badge: openCount || null },
    { id: 'create', label: 'New Ticket', icon: PlusCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Headphones size={18} color="white" />
        </div>
        <div>
          <div className="sidebar-logo-text">SupportDesk</div>
          <div className="sidebar-logo-sub">CRM</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Navigation</div>
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
          >
            <Icon size={16} />
            {label}
            {badge ? <span className="nav-badge">{badge}</span> : null}
          </button>
        ))}
      </nav>
    </aside>
  );
}
