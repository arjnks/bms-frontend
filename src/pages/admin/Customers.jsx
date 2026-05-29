import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { customersApi } from '../../api/customers';

const fmtAmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??';
const AV_COLORS = [
  { bg: '#fdf2f2', color: '#c0392b' }, { bg: '#fef9ec', color: '#b45309' },
  { bg: '#f0fdf4', color: '#166534' }, { bg: '#e8f0fe', color: '#1440a8' },
  { bg: '#fdf4ff', color: '#7c3aed' }, { bg: '#fff7ed', color: '#c2410c' },
];
const avColor = (id) => AV_COLORS[id % AV_COLORS.length];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [syncing, setSyncing]     = useState(false);
  const [syncMsg, setSyncMsg]     = useState('');
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [selected, setSelected]   = useState([]);
  const [acting, setActing]       = useState(false);
  const hasSynced = useRef(false);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      const res = await customersApi.list();
      const data = res.data?.data || res.data || res;
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync from billing system on first load if no customers in BMS
  const runSync = async (silent = false) => {
    if (syncing) return;
    setSyncing(true);
    if (!silent) setSyncMsg('Syncing customers from billing system…');
    try {
      const res = await customersApi.syncFromBilling();
      const d = res.data;
      if (!silent) {
        setSyncMsg(`✓ Sync done — ${d.created} new, ${d.updated} updated`);
        setTimeout(() => setSyncMsg(''), 4000);
      }
      await fetchCustomers();
    } catch (err) {
      if (!silent) {
        const msg = err?.response?.data?.message || 'Could not reach billing system';
        setSyncMsg(`⚠ ${msg}`);
        setTimeout(() => setSyncMsg(''), 5000);
        showToast(msg, 'error');
      }
      await fetchCustomers(); // Still load whatever's in DB
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Load customers directly from DB — no ERP call on page load.
    // Use the Sync button to pull fresh data from the billing system.
    fetchCustomers();
  }, []);


  const filtered = customers.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                        c.external_cucode?.toLowerCase().includes(search.toLowerCase());
    const outstandingNum = Number(c.outstanding_amount ?? 0);
    const matchFilter =
      filter === 'all' ||
      (filter === 'overdue' && outstandingNum > 0) ||
      (filter === 'paid'    && outstandingNum === 0);
    return matchSearch && matchFilter;
  });

  const toggleAll = (e) => setSelected(e.target.checked ? filtered.map(c => c.id) : []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleRemind = async (c) => {
    setActing(true);
    try {
      await customersApi.remind(c.id);
      showToast(`✓ Reminder sent to ${c.name}`);
    } catch { showToast('Failed to send reminder', 'error'); }
    finally { setActing(false); }
  };

  const handleBulkRemind = async () => {
    if (!selected.length) { showToast('Select at least one customer', 'warn'); return; }
    setActing(true);
    try {
      await customersApi.bulkRemind(selected);
      showToast(`✓ Reminder sent to ${selected.length} customer(s)`);
      setSelected([]);
    } catch { showToast('Failed to send bulk reminders', 'error'); }
    finally { setActing(false); }
  };

  const overdueCount = customers.filter(c => Number(c.outstanding_amount) > 0).length;

  return (
    <AppShell pendingPayments={0} pendingApprovals={0}>
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Customer Accounts</div>
          <div className="pg-sub">
            {loading || syncing
              ? syncMsg || 'Loading…'
              : `${customers.length} customers · ${overdueCount} with outstanding dues`}
          </div>
          {syncMsg && !syncing && (
            <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>{syncMsg}</div>
          )}
        </div>
        <div className="pg-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => runSync(false)}
            disabled={syncing || acting}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {syncing
              ? <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            }
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/bills/upload')}>
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Upload Bills
          </button>
        </div>
      </div>

      <Card>
        <CardHeader
          title={`All Customers (${filtered.length})`}
          actions={
            <div className="toolbar">
              <input type="text" placeholder="Search name / customer ID" value={search}
                onChange={e => setSearch(e.target.value)} />
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">All status</option>
                <option value="overdue">Has outstanding</option>
                <option value="paid">All clear</option>
              </select>
              <button className="btn btn-warn btn-sm" disabled={acting || syncing} onClick={handleBulkRemind}>
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Send Reminder{selected.length > 0 ? ` (${selected.length})` : ''}
              </button>
            </div>
          }
        />

        {loading || syncing ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-2)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 500 }}>{syncMsg || 'Loading customers…'}</div>
            {syncing && <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-3)' }}>Fetching from billing system, this may take a moment…</div>}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
            {customers.length === 0
              ? 'No customers found. Could not reach billing system.'
              : 'No customers match your search.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" onChange={toggleAll}
                  checked={selected.length === filtered.length && filtered.length > 0} /></th>
                <th>Customer</th><th>Outstanding</th><th>Format</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const av = avColor(c.id);
                const outstanding = Number(c.outstanding_amount ?? 0);
                return (
                  <tr key={c.id}>
                    <td><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} /></td>
                    <td>
                      <div className="cust-cell">
                        <div className="cust-av" style={{ background: av.bg, color: av.color }}>{initials(c.name)}</div>
                        <div>
                          <div className="cust-name">{c.name}</div>
                          <div className="cust-id">{c.external_cucode || 'No Code'}</div>
                        </div>
                      </div>
                    </td>
                    <td className={outstanding > 0 ? 'amt-red' : 'amt-green'}>{fmtAmt(outstanding)}</td>
                    <td>
                      <span className={`badge ${c.preferred_bill_format === 'csv' ? 'b-blue' : 'b-green'}`}
                        style={{ fontFamily: 'var(--mono)', letterSpacing: '.04em', textTransform: 'capitalize' }}>
                        {c.preferred_bill_format || 'excel'}
                      </span>
                    </td>
                    <td><StatusBadge status={outstanding > 0 ? 'overdue' : 'paid'} /></td>
                    <td>
                      <div className="act-btns">
                        <button className={`btn-xs${outstanding > 0 ? ' danger' : ''}`}
                          disabled={outstanding === 0 || acting}
                          style={outstanding === 0 ? { opacity: .4, cursor: 'default' } : {}}
                          onClick={() => handleRemind(c)}>Remind</button>
                        <button className="btn-xs" onClick={() => navigate(`/dashboard/customers/${c.id}`)}>View</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
