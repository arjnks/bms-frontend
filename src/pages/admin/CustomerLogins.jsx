import { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { customersApi } from '../../api/customers';

const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??';
const AV_COLORS = [
  { bg: '#fdf2f2', color: '#c0392b' }, { bg: '#fef9ec', color: '#b45309' },
  { bg: '#f0fdf4', color: '#166534' }, { bg: '#e8f0fe', color: '#1440a8' },
  { bg: '#fdf4ff', color: '#7c3aed' }, { bg: '#fff7ed', color: '#c2410c' },
];
const avColor = (id) => AV_COLORS[id % AV_COLORS.length];

export default function CustomerLogins() {
  const [logins, setLogins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [acting, setActing]     = useState(false);

  // Edit modal
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', external_cucode: '' });

  // Delete confirm modal
  const [deletingUser, setDeletingUser] = useState(null);

  const [syncing, setSyncing] = useState(false);

  const load = async (triggerSync = false) => {
    try {
      const res = await customersApi.list();
      const data = res.data?.data || res.data || res;
      const list = Array.isArray(data) ? data : [];
      setLogins(list);

      // Auto-sync if nothing in DB
      if (list.length === 0 && triggerSync && !syncing) {
        setSyncing(true);
        try {
          await customersApi.syncFromBilling();
          const res2 = await customersApi.list();
          const data2 = res2.data?.data || res2.data || res2;
          setLogins(Array.isArray(data2) ? data2 : []);
        } catch { /* billing offline, just show empty */ }
        finally { setSyncing(false); }
      }
    } catch { showToast('Failed to load customers', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(true); }, []);

  const filtered = logins.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.customer_code?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      email: user.email,
      external_cucode: user.external_cucode || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.email) {
      showToast('Name and email are required', 'warn');
      return;
    }
    setActing(true);
    try {
      await customersApi.update(editingUser.id, editForm);
      setLogins(prev => prev.map(l => l.id === editingUser.id ? { ...l, ...editForm } : l));
      showToast(`✓ Updated ${editForm.name}`);
      setEditingUser(null);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update', 'error');
    } finally { setActing(false); }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setActing(true);
    try {
      await customersApi.delete(deletingUser.id);
      setLogins(prev => prev.filter(l => l.id !== deletingUser.id));
      showToast(`✓ ${deletingUser.name} removed from BMS`);
      setDeletingUser(null);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to remove customer', 'error');
    } finally { setActing(false); }
  };

  return (
    <AppShell pendingPayments={0} pendingApprovals={0}>
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Login Credentials</div>
          <div className="pg-sub">Manage customer access and profile details</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title={`Customer Accounts (${filtered.length})`}
          actions={
            <div className="toolbar">
              <input type="text" placeholder="Search name, ID or email" value={search}
                onChange={e => setSearch(e.target.value)} style={{ width: 250 }} />
            </div>
          }
        />
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th><th>Login Email</th><th>Phone</th><th>Bill Code</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const av = avColor(l.id);
                const hasCucode = !!l.external_cucode;
                return (
                  <tr key={l.id}>
                    <td>
                      <div className="cust-cell">
                        <div className="cust-av" style={{ background: av.bg, color: av.color }}>{initials(l.name)}</div>
                        <div>
                          <div className="cust-name">{l.name}</div>
                          <div className="cust-id">{l.external_cucode || 'No Code'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--blue)' }}>{l.email}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {l.phone || <span style={{ color: 'var(--gray-2)', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td>
                      {hasCucode
                        ? <span className="badge b-green" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>✓ Linked</span>
                        : <span className="badge" style={{ background: 'var(--bg-3)', color: 'var(--text-3)', fontSize: 10 }}>Not linked</span>
                      }
                    </td>
                    <td><StatusBadge status="active" /></td>
                    <td>
                      <div className="act-btns">
                        <button className="btn-xs" disabled={acting} onClick={() => openEdit(l)}>Edit</button>
                        <button
                          className="btn-xs danger"
                          disabled={acting}
                          onClick={() => setDeletingUser(l)}
                          style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                        >Remove</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Edit Modal ── */}
      <Modal open={!!editingUser} onClose={() => !acting && setEditingUser(null)}>
        <div className="popup">
          <div className="popup-hdr">
            <div>
              <div className="popup-htitle">Edit Customer</div>
              <div className="popup-hsub">Update credentials and billing link</div>
            </div>
          </div>
          <div className="popup-body">
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Company / Contact Name</label>
              <input className="form-ctrl" type="text" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Phone Number</label>
              <input className="form-ctrl" type="tel" placeholder="+91 98765 43210"
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Login Email Address</label>
              <input className="form-ctrl" type="email" value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Customer Code</label>
              <input
                className="form-ctrl"
                type="text"
                placeholder="e.g. 0110679"
                value={editForm.external_cucode}
                onChange={e => setEditForm({ ...editForm, external_cucode: e.target.value })}
              />
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Links this customer to their bills. Get this from your billing software.
              </div>
            </div>
            <div className="popup-foot">
              <button className="btn-ghost" onClick={() => setEditingUser(null)} disabled={acting}>Cancel</button>
              <button className="btn-pay" onClick={handleSaveEdit} disabled={acting}>
                {acting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deletingUser} onClose={() => !acting && setDeletingUser(null)}>
        {deletingUser && (
          <div className="popup">
            <div className="popup-hdr" style={{ background: 'linear-gradient(135deg, #7f1d1d, #c0392b)' }}>
              <div className="popup-ico">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="#fff" fill="none" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div>
                <div className="popup-htitle">Remove Customer</div>
                <div className="popup-hsub">This action cannot be undone</div>
              </div>
            </div>
            <div className="popup-body">
              <div className="popup-note" style={{ textAlign: 'left', lineHeight: 1.7 }}>
                You are about to permanently remove <strong>{deletingUser.name}</strong> from BMS.<br /><br />
                This will delete:
                <ul style={{ marginLeft: 16, marginTop: 4, color: 'var(--text-2)' }}>
                  <li>Their login account</li>
                  <li>All their bills stored in BMS</li>
                  <li>All reminder history</li>
                </ul>
              </div>
              <div className="popup-foot" style={{ marginTop: '1.5rem' }}>
                <button className="btn-ghost" onClick={() => setDeletingUser(null)} disabled={acting}>Cancel</button>
                <button
                  className="btn-pay"
                  style={{ background: 'var(--red)' }}
                  onClick={handleDelete}
                  disabled={acting}
                >
                  {acting ? 'Removing…' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
