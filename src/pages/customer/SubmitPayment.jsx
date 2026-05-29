import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card, CardHeader } from '../../components/ui/Card';
import { showToast } from '../../components/ui/Toast';
import { billsApi } from '../../api/bills';

const fmtAmt = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

export default function SubmitPayment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [bill, setBill]         = useState(null);
  const [billLoading, setBillLoading] = useState(true);
  const [method, setMethod]     = useState('');
  const [utr, setUtr]           = useState('');
  const [file, setFile]         = useState(null);
  const [drag, setDrag]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load bill details to show real amount / invoice no.
  useEffect(() => {
    billsApi.get(id)
      .then(res => setBill(res.data || res))
      .catch(() => {
        showToast('Failed to load bill details', 'error');
      })
      .finally(() => setBillLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!method)       { showToast('Select a payment method.', 'warn'); return; }
    if (!utr.trim())   { showToast('Enter the UTR / transaction reference number.', 'warn'); return; }
    if (!file)         { showToast('Please upload a payment screenshot.', 'warn'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('payment_method', method === 'GPay' ? 'gpay' : 'neft');
      formData.append('utr_number', utr);
      formData.append('amount_paid', bill.grand_total);
      formData.append('payment_date', new Date().toISOString().split('T')[0]);
      formData.append('screenshot', file);

      await billsApi.submitPaymentProof(id, formData);
      setSubmitted(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const invoiceLabel = bill ? `#${bill.invoice_no}` : `#${id}`;
  const amtLabel     = bill ? fmtAmt(bill.grand_total) : '…';
  const dueLabel     = bill?.due_date ?? '-';

  if (!billLoading && !bill) {
    return (
      <div className="pg-wrap">
        <Navbar />
        <Sidebar />
        <main className="pg-main">
          <div className="breadcrumb">
            <span className="breadcrumb-item" onClick={() => navigate('/portal')}>Portal</span>
            <span className="breadcrumb-sep">›</span>
            <span>Submit Payment</span>
          </div>

          <div className="pg-hdr">
            <div><div className="pg-title">Bill Not Found</div><div className="pg-sub">The payment link has expired or the bill does not exist.</div></div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/portal')}>Return to Dashboard</button>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="main-content">
          <div style={{ maxWidth: 480, margin: '3rem auto', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: 'var(--green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid rgba(22,101,52,.2)' }}>
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="#166534" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Payment Proof Submitted!</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '1.75rem' }}>
              Your payment proof has been submitted for verification. Our team will verify the details and update your account within 24 hours. You'll be notified via WhatsApp.
            </div>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              {[
                ['Invoice', invoiceLabel],
                ['Amount', amtLabel],
                ['UTR / Ref No.', utr],
                ['Method', method],
                ['Status', 'Pending verification'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>{k}</span>
                  <span style={{ fontWeight: 600, fontFamily: k === 'UTR / Ref No.' ? 'var(--mono)' : 'inherit' }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }}
              onClick={() => navigate('/portal')}>
              Back to My Bills
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="main-content">
        <div className="breadcrumb">
          <a onClick={() => navigate('/portal')}>My Bills</a>
          <span className="breadcrumb-sep">›</span>
          <a onClick={() => navigate(`/portal/bills/${id}`)}>{invoiceLabel}</a>
          <span className="breadcrumb-sep">›</span>
          <span>Submit Payment</span>
        </div>

        <div className="pg-hdr">
          <div><div className="pg-title">Submit Payment Proof</div><div className="pg-sub">Attach UTR number and payment screenshot for verification</div></div>
        </div>

        <div style={{ maxWidth: 600 }}>
          {/* Bill summary banner */}
          <div style={{ background: 'linear-gradient(135deg, var(--blue), var(--blue-dark))', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, opacity: .7, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
                Invoice {invoiceLabel}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{billLoading ? '…' : amtLabel}</div>
              <div style={{ fontSize: 13, opacity: .7, marginTop: 2 }}>Due {dueLabel}</div>
            </div>
            <div style={{ fontSize: 40, opacity: .6 }}>💳</div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card style={{ marginBottom: '1.25rem' }}>
              <CardHeader title="Payment method" />
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: 12 }}>
                {[
                  { id: 'GPay', emoji: '📱', label: 'GPay / UPI', desc: 'Google Pay, PhonePe, Paytm etc.' },
                  { id: 'NEFT', emoji: '🏦', label: 'NEFT / RTGS', desc: 'Bank transfer' },
                ].map(m => (
                  <label key={m.id} style={{
                    flex: 1, border: `2px solid ${method === m.id ? 'var(--blue)' : 'var(--border)'}`,
                    borderRadius: 10, padding: '.9rem 1rem', cursor: 'pointer', transition: 'all .15s',
                    background: method === m.id ? 'var(--blue-light)' : 'var(--surface)',
                  }} onClick={() => setMethod(m.id)}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{m.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: method === m.id ? 'var(--blue-dark)' : 'var(--text)' }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{m.desc}</div>
                  </label>
                ))}
              </div>
            </Card>

            <Card style={{ marginBottom: '1.25rem' }}>
              <CardHeader title="Transaction details" />
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">UTR / Transaction Reference Number *</label>
                  <div className="form-hint">Found in your payment confirmation message or bank statement</div>
                  <input className="form-ctrl" style={{ fontFamily: 'var(--mono)' }} placeholder="e.g. TXN4829201930 or HDFC0029380201"
                    value={utr} onChange={e => setUtr(e.target.value)} />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment screenshot *</label>
                  <div className="form-hint">Upload a clear screenshot of the payment confirmation</div>
                  <div
                    style={{ border: `2px dashed ${drag ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 12, padding: '2rem', textAlign: 'center', background: drag ? 'var(--blue-light)' : 'var(--surface-2)', transition: 'all .15s', cursor: 'pointer' }}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                    onClick={() => document.getElementById('proof-inp').click()}
                  >
                    {file ? (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{file.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{(file.size / 1024).toFixed(0)} KB · Click to change</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Drop screenshot here or click to upload</div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>JPG, PNG · Max 5 MB</div>
                      </>
                    )}
                    <input id="proof-inp" type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => setFile(e.target.files[0])} />
                  </div>
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate(`/portal/bills/${id}`)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Submitting…' : '↑ Submit Payment Proof'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
