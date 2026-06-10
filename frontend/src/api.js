const BASE = import.meta.env.VITE_API_URL || '/api';

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  getTickets: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v && v !== 'All') q.set(k, v); });
    const qs = q.toString();
    return req('GET', `/tickets${qs ? '?' + qs : ''}`);
  },
  getStats: () => req('GET', '/tickets/stats'),
  getTicket: (id) => req('GET', `/tickets/${id}`),
  createTicket: (data) => req('POST', '/tickets', data),
  updateTicket: (id, data) => req('PUT', `/tickets/${id}`, data),
  deleteTicket: (id) => req('DELETE', `/tickets/${id}`),
};
