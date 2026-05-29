import { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import { usersApi } from '../../api/users';
import { fmtDateTime } from '../../utils/date';

export default function UserApprovals() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  // Approve modal state
  const [approveTarget, setApproveTarget] = useState(null);
  const [acting, setActing] = useState(false);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    try {
      const res = await usersApi.pending();
      setPending(res.data || res);
    } catch (err) {
      showToast('Failed to load pending users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openApprove = (u) => {
    setApproveTarget(u);
  };

  const doApprove = async () => {
    setActing(true);
    try {
      await usersApi.approve(approveTarget.id);
      setPending(ps => ps.filter(x => x.id !== approveTarget.id));
      showToast(`✓ ${approveTarget.name} approved`);
      setApproveTarget(null);
    } catch (err) {
      showToast(err?.message || 'Failed to approve user', 'error');
    } finally {
      setActing(false);
    }
  };

  const doReject = async () => {
    setActing(true);
    try {
      await usersApi.reject(rejectTarget.id, reason.trim() || null);
      setPending(ps => ps.filter(x => x.id !== rejectTarget.id));
      showToast(`${rejectTarget.name}'s request was rejected`, 'error');
      setRejectTarget(null); setReason('');
    } catch (err) {
      showToast(err?.message || 'Failed to reject user', 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <AppShell pendingPayments={0} pendingApprovals={pending.length}>
      <div className="pg-hdr">
        <div>
          <div className="pg-title">User Approvals</div>
          <div className="pg-sub">Review and approve new customer registrations</div>
        </div>
        {pending.length > 0 && (
          <span className="outstanding-badge" style={{ background: 'var(--amber-light)', color: 'var(--amber)', borderColor: 'rgba(180,83,9,.25)' }}>
            {pending.length} pending
          </span>
        )}
      </div>

      <Card>
        <CardHeader title="Pending Registrations" subtitle="New users waiting for account activation" />
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading…</div>
        ) : pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No pending requests</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>All registrations have been reviewed</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Submitted</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {pending.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="cust-cell">
                      <div className="cust-av" style={{ background: 'var(--blue-light)', color: 'var(--blue-dark)' }}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div className="cust-name">{u.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td style={{ fontSize: 13 }}>{u.phone}</td>
                  <td><span className="ch-tag ch-sms" style={{ textTransform: 'capitalize' }}>{u.role.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDateTime(u.created_at)}</td>
                  <td>
                    <div className="act-btns">
                      <button className="btn-xs" disabled={acting}
                        style={{ background: 'var(--green-light)', color: '#166534', borderColor: 'rgba(22,101,52,.25)' }}
                        onClick={() => openApprove(u)}>✓ Approve</button>
                      <button className="btn-xs danger" disabled={acting}
                        onClick={() => setRejectTarget(u)}>✕ Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Approve modal ── */}
      <Modal open={!!approveTarget} onClose={() => setApproveTarget(null)}>
        <div className="popup" style={{ width: 460 }}>
          <div className="popup-hdr" style={{ background: 'linear-gradient(135deg, #166534, #1a7a45)' }}>
            <div className="popup-ico">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
            <div>
              <div className="popup-htitle">Approve Registration</div>
              <div className="popup-hsub">{approveTarget?.name} · {approveTarget?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <div className="popup-body">
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Are you sure you want to approve this registration? The user will be notified via WhatsApp.
            </p>

            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '.75rem 1rem', fontSize: 13, marginBottom: '1.25rem', display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>Email</span>
                <span>{approveTarget?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>Phone</span>
                <span>{approveTarget?.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-2)' }}>Submitted</span>
                <span>{approveTarget && fmtDateTime(approveTarget.created_at)}</span>
              </div>
            </div>

            <div className="popup-foot">
              <button className="btn-ghost" onClick={() => setApproveTarget(null)}>Cancel</button>
              <button className="btn-pay" style={{ background: '#166534', flex: 2 }} disabled={acting} onClick={doApprove}>
                {acting ? 'Approving…' : '✓ Approve User'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Reject modal ── */}
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setReason(''); }}>
        <div className="popup" style={{ width: 420 }}>
          <div className="popup-hdr">
            <div className="popup-ico"><svg viewBox="0 0 24 24" width="22" height="22" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
            <div><div className="popup-htitle">Reject Registration</div><div className="popup-hsub">{rejectTarget?.name}</div></div>
          </div>
          <div className="popup-body">
            <div className="form-group">
              <label className="form-label">Reason (optional - sent to user)</label>
              <textarea className="form-ctrl" rows={3} placeholder="e.g. Incomplete details provided…"
                value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <div className="popup-foot">
              <button className="btn-ghost" onClick={() => { setRejectTarget(null); setReason(''); }}>Cancel</button>
              <button className="btn-pay" style={{ background: 'var(--red)' }} disabled={acting} onClick={doReject}>
                {acting ? 'Rejecting…' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
