import { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { showToast } from '../../components/ui/Toast';
import { billsApi } from '../../api/bills';
import { fmtDateTime } from '../../utils/date';

const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

export default function PaymentVerifications() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyConfirm, setVerifyConfirm] = useState(null);
  const [acting, setActing] = useState(false);

  const load = async () => {
    try {
      const res = await billsApi.adminList({ payment_status: 'payment_submitted' });
      setPending(res.data?.data || res.data || res);
    } catch (err) {
      showToast('Failed to load pending payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const doVerify = async (p) => {
    setActing(true);
    try {
      await billsApi.verifyPayment(p.id);
      setPending(ps => ps.filter(x => x.id !== p.id));
      setSelected(null); setVerifyConfirm(null);
      showToast(`✓ Payment verified for ${p.customer_name}`);
    } catch (err) {
      showToast(err?.message || 'Failed to verify payment', 'error');
    } finally {
      setActing(false);
    }
  };

  const verify = (p) => setVerifyConfirm(p);

  const reject = async () => {
    if (!rejectReason.trim()) { showToast('Please enter a rejection reason.', 'warn'); return; }
    setActing(true);
    try {
      await billsApi.rejectPayment(selected.id, rejectReason);
      setPending(ps => ps.filter(x => x.id !== selected.id));
      showToast(`Payment proof rejected - ${selected.customer_name} will be notified`, 'error');
      setSelected(null); setRejectModal(false); setRejectReason('');
    } catch (err) {
      showToast(err?.message || 'Failed to reject payment', 'error');
    } finally {
      setActing(false);
    }
  };

  return (
    <AppShell pendingPayments={pending.length} pendingApprovals={0}>
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Payment Verifications</div>
          <div className="pg-sub">Review payment proofs submitted by customers</div>
        </div>
        {pending.length > 0 && (
          <span className="outstanding-badge" style={{ background: 'var(--amber-light)', color: 'var(--amber)', borderColor: 'rgba(180,83,9,.25)' }}>
            {pending.length} pending review
          </span>
        )}
      </div>

      <Card>
        <CardHeader title="Pending Payment Proofs" subtitle="Verify UTR number and screenshot before approving" />
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading…</div>
        ) : pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>All caught up!</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>No payment proofs awaiting review</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Bill</th><th>Customer</th><th>Amount</th><th>Method</th><th>UTR / Ref</th><th>Submitted</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {pending.map(p => (
                <tr key={p.id}>
                  <td className="bill-no">{p.invoice_no}</td>
                  <td>
                    <div className="cust-cell">
                      <div className="cust-av" style={{ background: 'var(--blue-light)', color: 'var(--blue-dark)' }}>{p.customer_name?.split(' ').map(n => n[0]).join('').slice(0,2) || '??'}</div>
                      <div>
                        <div className="cust-name">{p.customer_name}</div>
                        <div className="cust-id">Date: {p.bill_date}</div>
                      </div>
                    </div>
                  </td>
                  <td className="amt-green" style={{ fontWeight: 600 }}>{formatCurrency(p.grand_total)}</td>
                  <td><span className={`ch-tag ${p.payment_method === 'gpay' ? 'ch-wa' : 'ch-sms'}`}>
                    {p.payment_method === 'gpay' ? 'GPay' : p.payment_method === 'neft' ? 'NEFT' : p.payment_method || '-'}
                  </span></td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{p.utr_number || '-'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {p.payment_submitted_at ? fmtDateTime(p.payment_submitted_at) : '-'}
                  </td>
                  <td>
                    <div className="act-btns">
                      <button className="btn-xs" onClick={() => setSelected(p)}>
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Review
                      </button>
                      <button className="btn-xs" style={{ background: 'var(--green-light)', color: '#166534', borderColor: 'rgba(22,101,52,.25)' }}
                        onClick={() => verify(p)}>✓ Verify</button>
                      <button className="btn-xs danger" onClick={() => { setSelected(p); setRejectModal(true); }}>✕ Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Detail panel */}
      <Modal open={!!selected && !rejectModal} onClose={() => setSelected(null)}>
        {selected && (
          <div className="popup" style={{ width: 500 }}>
            <div className="popup-hdr" style={{ background: 'linear-gradient(135deg, #166534, #1a56db)' }}>
              <div className="popup-ico"><svg viewBox="0 0 24 24" width="22" height="22" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
              <div><div className="popup-htitle">Payment Proof - {selected.invoice_no}</div><div className="popup-hsub">{selected.customer_name}</div></div>
            </div>
            <div className="popup-body">
              <div className="popup-amt-row"><div className="popup-amt" style={{ color: '#166534' }}>{formatCurrency(selected.grand_total)}</div><div className="popup-amt-lbl">submitted</div></div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', display: 'grid', gap: 8 }}>
                {[
                  ['Payment Method', selected.payment_method === 'gpay' ? 'Google Pay (GPay)' : selected.payment_method === 'neft' ? 'NEFT / Bank Transfer' : selected.payment_method || '-'],
                  ['UTR / Reference No.', selected.utr_number || '-'],
                  ['Submitted At', fmtDateTime(selected.payment_submitted_at)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-2)' }}>{k}</span>
                    <span style={{ fontWeight: 600, fontFamily: k.includes('UTR') ? 'var(--mono)' : 'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>
              {selected.proof_screenshot ? (
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <a href={`http://localhost:8000/storage/${selected.proof_screenshot}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', maxWidth: '100%', maxHeight: '400px', overflow: 'hidden', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <img src={`http://localhost:8000/storage/${selected.proof_screenshot}`} alt="Payment Proof" style={{ display: 'block', maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                  </a>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 8 }}>Click to view full size</div>
                </div>
              ) : (
                <div style={{ background: 'var(--gray-4)', border: '2px dashed var(--border)', borderRadius: 10, padding: '2rem', textAlign: 'center', marginBottom: '1.25rem', color: 'var(--text-2)', fontSize: 13 }}>
                  No screenshot provided.
                </div>
              )}
              <div className="popup-foot">
                <button className="btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
                <button className="btn-pay" style={{ background: 'var(--red)', flex: 1 }}
                  onClick={() => { setRejectModal(true); }}>✕ Reject</button>
                <button className="btn-pay" style={{ flex: 2 }} onClick={() => verify(selected)}>✓ Verify Payment</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal open={rejectModal} onClose={() => { setRejectModal(false); setRejectReason(''); }}>
        <div className="popup" style={{ width: 420 }}>
          <div className="popup-hdr">
            <div className="popup-ico"><svg viewBox="0 0 24 24" width="22" height="22" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
            <div><div className="popup-htitle">Reject Payment Proof</div><div className="popup-hsub">Customer will be notified via WhatsApp</div></div>
          </div>
          <div className="popup-body">
            <div className="form-group">
              <label className="form-label">Reason for rejection</label>
              <textarea className="form-ctrl" rows={3} placeholder="e.g. UTR number doesn't match, screenshot unclear…"
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="popup-foot">
              <button className="btn-ghost" onClick={() => { setRejectModal(false); setRejectReason(''); }}>Cancel</button>
              <button className="btn-pay" style={{ background: 'var(--red)' }} disabled={acting} onClick={reject}>
                {acting ? 'Sending…' : 'Send Rejection'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Verify confirmation popup */}
      <Modal open={!!verifyConfirm} onClose={() => setVerifyConfirm(null)}>
        {verifyConfirm && (
          <div className="popup" style={{ width: 460 }}>
            <div className="popup-hdr" style={{ background: 'linear-gradient(135deg, #166534, #1a7a45)' }}>
              <div className="popup-ico">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
              <div>
                <div className="popup-htitle">Confirm Payment Verification</div>
                <div className="popup-hsub">{verifyConfirm.invoice_no} · {verifyConfirm.customer_name}</div>
              </div>
            </div>
            <div className="popup-body">
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                Are you sure you want to mark <strong>{verifyConfirm.invoice_no}</strong> as paid?{' '}
                This will notify <strong>{verifyConfirm.customer_name}</strong> via WhatsApp and cannot be undone.
              </p>
              <div style={{ background: 'var(--green-light)', border: '1px solid rgba(22,101,52,.2)', borderRadius: 'var(--radius)', padding: '.75rem 1rem', fontSize: 13, color: '#166534', marginBottom: '1.25rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="#166534" fill="none" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Amount: <strong>{formatCurrency(verifyConfirm.grand_total)}</strong> · UTR: <span style={{ fontFamily: 'var(--mono)' }}>{verifyConfirm.utr_number || '-'}</span>
              </div>
              <div className="popup-foot">
                <button className="btn-ghost" onClick={() => setVerifyConfirm(null)}>Cancel</button>
                <button className="btn-pay" style={{ background: '#166534', flex: 2 }} disabled={acting}
                  onClick={() => doVerify(verifyConfirm)}>
                  {acting ? 'Verifying…' : '✓ Yes, Verify Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
