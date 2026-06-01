import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { billsApi } from '../../api/bills';

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_LABELS = {
  gpay: 'GPay / UPI',
  neft: 'NEFT / Bank Transfer',
};

const STATUS_COLORS = {
  paid:              { bg: '#dcfce7', color: '#166534' },
  unpaid:            { bg: '#fee2e2', color: '#991b1b' },
  payment_submitted: { bg: '#fef9c3', color: '#854d0e' },
  proof_rejected:    { bg: '#fee2e2', color: '#991b1b' },
};

const getItemName = (l) => l.product_name ?? l.ITEMNAME ?? l.item_name ?? '-';
const getHsn = (l) => l.hsn_code ?? l.HSNCODE ?? '-';
const getQty = (l) => l.qty ?? l.quantity ?? l.QUANTITY ?? 0;
const getRate = (l) => l.rate ?? l.unit_price ?? l.SRATE ?? 0;
const getGst = (l) => l.gst_pct ?? l.gst_percentage ?? l.GSTRATE ?? 0;
const getTotal = (l) => {
  if (l.line_total != null) return Number(l.line_total);
  if (l.total_amount != null) return Number(l.total_amount);
  if (l.TOTALAMOUNT != null) return Number(l.TOTALAMOUNT);

  const base = Number(getQty(l)) * Number(getRate(l));
  return base + base * Number(getGst(l)) / 100;
};

export default function AdminBillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bill, setBill]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [actionLoading, setAction]    = useState('');
  const [showRejectForm, setRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [proofOpen, setProofOpen]     = useState(false);

  const load = () => {
    setLoading(true);
    billsApi.adminGet(id)
      .then(res => setBill(res.data ?? res))
      .catch(() => showToast('Failed to load bill', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await billsApi.adminDownload(id);
      const url = res.download_url || res.url;
      if (url) window.open(url, '_blank');
      else showToast('No file available for this bill.', 'error');
    } catch {
      showToast('Download failed. Please try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleVerify = async () => {
    setAction('verify');
    try {
      await billsApi.verifyPayment(id);
      showToast('Payment verified successfully', 'success');
      load();
    } catch {
      showToast('Failed to verify payment', 'error');
    } finally { setAction(''); }
  };

  const handleMarkPaid = async () => {
    if (!window.confirm('Are you sure you want to mark this bill as paid?')) return;
    setAction('mark');
    try {
      await billsApi.markPaid(id);
      showToast('Bill marked as paid', 'success');
      load();
    } catch {
      showToast('Failed to mark as paid', 'error');
    } finally { setAction(''); }
  };

  const handleRevert = async () => {
    if (!window.confirm('Are you sure you want to revert this bill to unpaid?')) return;
    setAction('revert');
    try {
      await billsApi.revert(id);
      showToast('Bill reverted to unpaid', 'success');
      load();
    } catch {
      showToast('Failed to revert bill', 'error');
    } finally { setAction(''); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('Please enter a rejection reason', 'error'); return; }
    setAction('reject');
    try {
      await billsApi.rejectPayment(id, rejectReason);
      showToast('Payment proof rejected', 'success');
      setRejectForm(false);
      setRejectReason('');
      load();
    } catch {
      showToast('Failed to reject payment', 'error');
    } finally { setAction(''); }
  };

  if (loading) return (
    <AppShell>
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-2)' }}>Loading bill…</div>
    </AppShell>
  );

  if (!bill) return (
    <AppShell>
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-2)' }}>Bill not found.</div>
    </AppShell>
  );

  const statusStyle = STATUS_COLORS[bill.payment_status] ?? { bg: 'var(--surface-2)', color: 'var(--text-2)' };
  const hasProof = !!bill.proof_url;
  const lineItems = bill.line_items ?? bill.lineItems ?? [];

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <a onClick={() => navigate('/dashboard/bills')}>All Bills</a>
        <span className="breadcrumb-sep">›</span>
        <span>#{bill.invoice_no}</span>
      </div>

      {/* Page header */}
      <div className="pg-hdr">
        <div>
          <div className="pg-title">#{bill.invoice_no}</div>
          <div className="pg-sub">
            {bill.customer_name}
            {bill.customer_code && <span style={{ marginLeft: 8, opacity: .7, fontFamily: 'var(--mono)', fontSize: 12 }}>({bill.customer_code})</span>}
          </div>
        </div>
        <div className="pg-actions">
          <StatusBadge status={bill.payment_status} />
          <button
            className="btn btn-outline btn-sm"
            onClick={handleDownload}
            disabled={downloading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {downloading
              ? <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              : <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            }
            {downloading ? 'Downloading…' : 'Download Bill'}
          </button>
        </div>
      </div>

      <div className="form-layout">
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Bill summary */}
          <Card>
            <CardHeader title="Bill Summary" />
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Invoice No.',  `#${bill.invoice_no}`],
                ['Customer',     bill.customer_name],
                ['Customer Code', bill.customer_code || '—'],
                ['Bill Date',    bill.bill_date || '—'],
                ['Due Date',     bill.due_date  || '—'],
                ['Format',       (bill.bill_file_type || 'excel').toUpperCase()],
              ].map(([k, v]) => (
                <div key={k} className="setting-row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: k === 'Invoice No.' || k === 'Customer Code' ? 'var(--mono)' : 'inherit' }}>{v}</span>
                </div>
              ))}
              {/* Amount row */}
              <div style={{ marginTop: 8, padding: '12px 0', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Grand Total</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>{fmt(bill.grand_total)}</span>
              </div>
            </div>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader title={`Line Items (${lineItems.length})`} />
            {lineItems.length === 0 ? (
              <div style={{ padding: '1.5rem', color: 'var(--text-2)', fontSize: 13 }}>
                No products were returned for this bill.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>HSN</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate</th>
                    <th style={{ textAlign: 'right' }}>GST%</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((l, i) => {
                    const total = getTotal(l);
                    return (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{getItemName(l)}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{getHsn(l)}</td>
                        <td style={{ textAlign: 'right' }}>{getQty(l)}</td>
                        <td style={{ textAlign: 'right' }}>Rs. {Number(getRate(l)).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right' }}><span className="badge b-blue">{getGst(l)}%</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Payment Status card */}
          <Card>
            <CardHeader title="Payment Status" />
            <div style={{ padding: '1.25rem 1.5rem' }}>
              {/* Status pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 16px', borderRadius: 99, marginBottom: '1.25rem',
                background: statusStyle.bg, color: statusStyle.color, fontWeight: 700, fontSize: 13,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                {bill.payment_status === 'payment_submitted' ? 'Proof Submitted – Awaiting Review'
                  : bill.payment_status === 'proof_rejected'  ? 'Proof Rejected'
                  : bill.payment_status === 'paid'            ? 'Paid'
                  : 'Unpaid'}
              </div>

              {/* Payment details if submitted */}
              {bill.payment_status === 'payment_submitted' || bill.payment_status === 'paid' || bill.payment_status === 'proof_rejected' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bill.payment_method && (
                    <div className="setting-row" style={{ padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Method</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{PAYMENT_LABELS[bill.payment_method] || bill.payment_method}</span>
                    </div>
                  )}
                  {bill.utr_number && (
                    <div className="setting-row" style={{ padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>UTR / Ref No.</span>
                      <span style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--mono)' }}>{bill.utr_number}</span>
                    </div>
                  )}
                  {bill.payment_submitted_at && (
                    <div className="setting-row" style={{ padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Submitted At</span>
                      <span style={{ fontSize: 13 }}>{new Date(bill.payment_submitted_at).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {bill.payment_verified_at && (
                    <div className="setting-row" style={{ padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Verified At</span>
                      <span style={{ fontSize: 13 }}>{new Date(bill.payment_verified_at).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {bill.rejection_reason && (
                    <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 13 }}>
                      <strong>Rejection reason:</strong> {bill.rejection_reason}
                    </div>
                  )}

                  {/* Proof screenshot */}
                  {hasProof && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, marginBottom: 6 }}>PAYMENT PROOF</div>
                      <div
                        onClick={() => setProofOpen(true)}
                        style={{
                          cursor: 'pointer', borderRadius: 10, overflow: 'hidden',
                          border: '2px solid var(--border)', maxHeight: 180,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--surface-2)',
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <img
                          src={bill.proof_url}
                          alt="Payment proof"
                          style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div style={{ display: 'none', padding: '2rem', color: 'var(--text-2)', fontSize: 13 }}>📎 Click to open screenshot</div>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                        onClick={() => window.open(bill.proof_url, '_blank')}
                      >Open full size ↗</button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-2)', fontSize: 13 }}>No payment has been submitted yet.</div>
              )}
            </div>
          </Card>

          {/* Action buttons */}
          <Card>
            <CardHeader title="Actions" />
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bill.payment_status === 'payment_submitted' && (
                <>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #059669, #047857)' }}
                    onClick={handleVerify}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'verify'
                      ? <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      : '✓'} Verify Payment
                  </button>
                  <button
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center', background: '#fee2e2', color: '#991b1b', border: '1.5px solid #fca5a5', fontWeight: 600, borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontSize: 13 }}
                    onClick={() => setRejectForm(v => !v)}
                    disabled={!!actionLoading}
                  >✕ Reject Proof</button>
                </>
              )}
              {(bill.payment_status === 'unpaid' || bill.payment_status === 'proof_rejected') && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleMarkPaid}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'mark'
                    ? <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    : '✓'} Mark as Paid
                </button>
              )}

              {bill.payment_status === 'paid' && (
                <button
                  className="btn"
                  style={{ width: '100%', justifyContent: 'center', background: '#f3f4f6', color: '#374151', border: '1.5px solid #d1d5db', fontWeight: 600, borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontSize: 13 }}
                  onClick={handleRevert}
                  disabled={!!actionLoading}
                >
                  {actionLoading === 'revert' ? '…' : '↺ Revert to Unpaid'}
                </button>
              )}

              {/* Reject form */}
              {showRejectForm && (
                <div style={{ marginTop: 8, padding: '1rem', borderRadius: 10, border: '1.5px solid #fca5a5', background: '#fff5f5' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>Rejection Reason</div>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explain why the payment proof is rejected…"
                    rows={3}
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #fca5a5', padding: '8px 10px', fontSize: 13, resize: 'vertical', background: '#fff', color: 'var(--text)', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => { setRejectForm(false); setRejectReason(''); }}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >Cancel</button>
                    <button
                      className="btn btn-sm"
                      onClick={handleReject}
                      disabled={actionLoading === 'reject'}
                      style={{ flex: 1, justifyContent: 'center', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                    >
                      {actionLoading === 'reject' ? '…' : 'Confirm Reject'}
                    </button>
                  </div>
                </div>
              )}

              <button
                className="btn btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                onClick={() => navigate(`/dashboard/customers/${bill.customer_id}`)}
              >View Customer Profile →</button>
            </div>
          </Card>
        </div>
      </div>

      {/* Full-size proof modal */}
      {proofOpen && (
        <div
          onClick={() => setProofOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={bill.proof_url}
            alt="Payment proof full size"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </AppShell>
  );
}
