import React, { useState, useEffect } from 'react';
import { ToastProvider } from './hooks/useToast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TicketsList from './pages/TicketsList';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import Analytics from './pages/Analytics';
import { api } from './api';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    api.getStats().then(s => setOpenCount(s.open)).catch(() => {});
  }, [page]);

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return <Dashboard setPage={setPage} setSelectedTicket={setSelectedTicket} />;
      case 'tickets':
        return <TicketsList setPage={setPage} setSelectedTicket={setSelectedTicket} />;
      case 'create':
        return <CreateTicket setPage={setPage} setSelectedTicket={setSelectedTicket} />;
      case 'detail':
        return (
          <TicketDetail
            ticketId={selectedTicket}
            setPage={setPage}
            onDelete={() => setSelectedTicket(null)}
          />
        );
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard setPage={setPage} setSelectedTicket={setSelectedTicket} />;
    }
  }

  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar page={page} setPage={setPage} openCount={openCount} />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </ToastProvider>
  );
}
