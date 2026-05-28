import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/ui/Toast';
import { billsApi } from '../../api/bills';

const fmtAmt = (n) => `â‚¹${Number(n).toLocaleString('en-IN')}`;
const fmtAmt2 = (n) => `â‚¹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

const POPUP_NONE        = null;
const POPUP_OUTSTANDING = 'outstanding';
const POPUP_REJECTED    = 'rejected';

export default function MyBills() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  // Tab: 'manual' or 'external'
  const [tab, setTab] = useState(location.state?.tab === 'external' ? 'external' : 'manual');

  // â”€â”€ Manual bills state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [bills, setBills]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [popupType, setPopupType] = useState(POPUP_NONE);
  const [rejectedBill, setRejectedBill] = useState(null);

  // â”€â”€ External bills state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [fromDate, setFromDate]       = useState(firstOfMonth());
  const [toDate, setToDate]           = useState(today());
  const [extBills, setExtBills]       = useState([]);
  const [extLoading, setExtLoading]   = useState(false);
  const [extFetched, setExtFetched]   = useState(false);
  const hasCucode = !!user?.customer?.external_cucode;

  // Load manual bills
  const load = async () => {
    try {
      const res = await billsApi.list();
      setBills(Array.isArray(res.bills) ? res.bills : (res.data || []));
    } catch { showToast('Failed to load bills', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Decide popup on mount
  useEffect(() => {
    if (loading || bills.length === 0) return;
    const rejected = bills.find(b => b.payment_status === 'proof_rejected');
    if (rejected && !sessionStorage.getItem(`leo-reject-shown-${rejected.id}`)) {
      sessionStorage.setItem(`leo-reject-shown-${rejected.id}`, '1');
      setRejectedBill(rejected);
      setTimeout(() => setPopupType(POPUP_REJECTED), 600);
      return;
    }
    const hasOnlyUnpaid = bills.some(b => b.payment_status === 'unpaid');
    if (hasOnlyUnpaid && !sessionStorage.getItem('leo-popup-shown')) {
      sessionStorage.setItem('leo-popup-shown', '1');
      setTimeout(() => setPopupType(POPUP_OUTSTANDING), 600);
    }
  }, [loading, bills]);

  // Fetch external bills — called automatically on tab switch
  const fetchExternal = async (from, to) => {
    if (!hasCucode) return;
    setExtLoading(true);
    setExtFetched(true);
    try {
      const res = await billsApi.externalList({ from_date: from || fromDate, to_date: to || toDate });
      setExtBills(res.data ?? []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to fetch bills';
      showToast(msg, 'error');
    } finally { setExtLoading(false); }
  };

  // Auto-fetch when switching to bills-by-date tab
  useEffect(() => {
    if (tab === 'external' && hasCucode && !extFetched) {
      fetchExternal();
    }
  }, [tab, hasCucode]);

  const outstanding = bills
    .filter(b => b.payment_status === 'unpaid' || b.payment_status === 'proof_rejected')
    .reduce((s, b) => s + Number(b.grand_total), 0);

  const thisMonth = bills.filter(b => {
    const d = new Date(b.bill_date); const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const lastPaid = bills
    .filter(b => b.payment_status === 'paid')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

  const handleDownloadPdf = async (bill) => {
    try {
      const res = await billsApi.downloadUrl(bill.id);
      const url = res.download_url || res.url;
      if (url) window.open(url, '_blank');
      else showToast('File not yet available.', 'error');
    } catch { showToast('Failed to get download link', 'error'); }
  };

  const filtered = bills.filter(b => {
    const matchSearch = b.invoice_no?.toLowerCase().includes(search.toLowerCase()) || String(b.grand_total).includes(search);
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'paid'    && b.payment_status === 'paid') ||
      (statusFilter === 'unpaid'  && (b.payment_status === 'unpaid' || b.payment_status === 'proof_rejected')) ||
      (statusFilter === 'overdue' && b.status === 'overdue');
    return matchSearch && matchStatus;
  });

  return (
    <>
      <Navbar outstandingAmt={outstanding > 0 ? fmtAmt(outstanding).replace('â‚¹', '') : null} />
      <Sidebar />
      <main className="main-content">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">My Bills</div>
            <div className="pg-sub">{user?.name} â€” Customer ID: {user?.customer?.customer_code || 'N/A'}</div>
          </div>
          {outstanding > 0 && <span className="outstanding-badge">{fmtAmt(outstanding)} outstanding</span>}
        </div>

        {/* Metrics */}
        <div className="metrics">
          <div className="metric"><div className="metric-label">Total bills</div><div className="metric-val">{bills.length}</div></div>
          <div className="metric"><div className="metric-label">This month</div><div className="metric-val">{thisMonth}</div></div>
          <div className="metric"><div className="metric-label">Outstanding</div><div className="metric-val red">{fmtAmt(outstanding)}</div></div>
          <div className="metric">
            <div className="metric-label">Last paid</div>
            <div className="metric-val" style={{ fontSize: 20 }}>
              {lastPaid ? new Date(lastPaid.updated_at).toLocaleDateString('en-IN') : 'â€”'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
          {[
            { key: 'manual',   label: '📋 Bill History' },
            { key: 'external', label: '📅 Bills by Date' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 20px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: 'none', color: tab === t.key ? 'var(--blue)' : 'var(--text-2)',
              borderBottom: tab === t.key ? '2px solid var(--blue)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ———————————————————————————————————————————————————————————————————————————— */}
        {tab === 'manual' && (
          <div className="card">
            <div className="card-hdr">
              <div className="card-title">Bill history</div>
              <div className="search-row">
                <input type="text" placeholder="Search bill no. or amount" value={search} onChange={e => setSearch(e.target.value)} />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading…</div>
            ) : bills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>No bills found</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Bill no.</th><th>Date issued</th><th>Amount</th><th>Due date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id}>
                      <td className="bill-no" style={{ cursor: 'pointer' }} onClick={() => navigate(`/portal/bills/${b.id}`)}>#{b.invoice_no}</td>
                      <td style={{ fontSize: 13 }}>{b.bill_date}</td>
                      <td style={{ fontWeight: 600 }}>{fmtAmt(b.grand_total)}</td>
                      <td style={{ fontSize: 13 }}>{b.due_date}</td>
                      <td><StatusBadge status={b.payment_status === 'paid' ? 'paid' : b.status} /></td>
                      <td>
                        <div className="act-btns">
                          <button className="btn-dl" onClick={() => navigate(`/portal/bills/${b.id}`)}>
                            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View
                          </button>
                          <button className="btn-dl" onClick={() => handleDownloadPdf(b)}>
                            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download
                          </button>
                          {b.payment_status === 'unpaid' && (
                            <button className="btn-dl" style={{ color: 'var(--blue)', borderColor: 'var(--blue)' }} onClick={() => navigate(`/portal/bills/${b.id}/pay`)}>Pay</button>
                          )}
                          {b.payment_status === 'proof_rejected' && (
                            <button className="btn-dl" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => navigate(`/portal/bills/${b.id}/pay`)}>Resubmit</button>
                          )}
                          {b.payment_status === 'payment_submitted' && (
                            <span style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 8px' }}>Under review</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ———————————————————————————————————————————————————————————————————————————— */}
        {tab === 'external' && (
          <div>
            {!hasCucode ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Not linked to billing system</div>
                <div style={{ color: 'var(--text-2)', fontSize: 13 }}>
                  Your account isn't linked to your bills yet. Contact your admin to set this up.
                </div>
              </div>
            ) : (
              <>
                {/* Date range picker */}
                <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 4, fontWeight: 600 }}>From Date</label>
                      <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 4, fontWeight: 600 }}>To Date</label>
                      <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 13 }} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => fetchExternal()}
                      disabled={extLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {extLoading
                        ? <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      }
                      {extLoading ? 'Loading…' : 'Refresh'}
                    </button>
                  </div>
                </div>

                {/* Results */}
                {extFetched && (
                  <div className="card">
                    <div className="card-hdr">
                      <div className="card-title">Bills ({extBills.length})</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{fromDate} → {toDate}</div>
                    </div>
                    {extLoading ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading…</div>
                    ) : extBills.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
                        No bills found for this date range
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr><th>Bill No.</th><th>Date</th><th>Net Amount</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                          {extBills.map((b, i) => (
                            <tr key={i}>
                              <td className="bill-no" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{b.BN}</td>
                              <td style={{ fontSize: 13 }}>{b.DATE}</td>
                              <td style={{ fontWeight: 600 }}>{fmtAmt2(b.NETAMOUNT)}</td>
                              <td>
                                <div className="act-btns">
                                  <button className="btn-dl" onClick={() => navigate(`/portal/external-bills/${b.BILLNO}`)}>
                                    <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View & Download
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* â”€â”€ Outstanding Popup â”€â”€ */}
      <Modal open={popupType === POPUP_OUTSTANDING} onClose={() => setPopupType(POPUP_NONE)}>
        <div className="popup">
          <div className="popup-hdr">
            <div className="popup-ico">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="popup-htitle">Outstanding payment due</div>
              <div className="popup-hsub">Action required on your account</div>
            </div>
          </div>
          <div className="popup-body">
            <div className="popup-amt-row">
              <div className="popup-amt">{fmtAmt(outstanding)}</div>
              <div className="popup-amt-lbl">total outstanding</div>
            </div>
            <div className="popup-note">Please clear your dues to continue receiving supplies without interruption.</div>
            <div className="popup-foot">
              <button className="btn-ghost" onClick={() => setPopupType(POPUP_NONE)}>Remind me later</button>
              <button className="btn-pay" onClick={() => { setPopupType(POPUP_NONE); const f = bills.find(b => b.payment_status === 'unpaid'); if (f) navigate(`/portal/bills/${f.id}/pay`); }}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Pay now
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* â”€â”€ Rejection Popup â”€â”€ */}
      <Modal open={popupType === POPUP_REJECTED} onClose={() => setPopupType(POPUP_NONE)}>
        {rejectedBill && (
          <div className="popup">
            <div className="popup-hdr" style={{ background: 'linear-gradient(135deg, #7f1d1d, #c0392b)' }}>
              <div className="popup-ico">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <div className="popup-htitle">Payment Proof Rejected</div>
                <div className="popup-hsub">Invoice #{rejectedBill.invoice_no} Â· Leo Group</div>
              </div>
            </div>
            <div className="popup-body">
              <div className="popup-amt-row">
                <div className="popup-amt" style={{ color: 'var(--red)' }}>{fmtAmt(rejectedBill.grand_total)}</div>
                <div className="popup-amt-lbl">amount due</div>
              </div>
              <div className="popup-note" style={{ textAlign: 'left', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Dear <strong>{user?.name ?? 'Customer'}</strong>,<br /><br />
                Your payment proof for invoice <strong>#{rejectedBill.invoice_no}</strong> has been <span style={{ color: 'var(--red)', fontWeight: 600 }}>rejected</span>.<br /><br />
                <strong>Reason:</strong> <span style={{ color: 'var(--text)' }}>{rejectedBill.rejection_reason || 'The payment proof could not be verified.'}</span><br /><br />
                Please resubmit with the correct details.
              </div>
              <div className="popup-foot">
                <button className="btn-ghost" onClick={() => setPopupType(POPUP_NONE)}>Dismiss</button>
                <button className="btn-pay" style={{ background: 'var(--red)' }} onClick={() => { setPopupType(POPUP_NONE); navigate(`/portal/bills/${rejectedBill.id}/pay`); }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="#fff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                  Resubmit
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
