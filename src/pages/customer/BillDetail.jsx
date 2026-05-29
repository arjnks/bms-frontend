import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { billsApi } from '../../api/bills';
import { useAuth } from '../../context/AuthContext';

const lineTotal = (l) => {
  const qty = Number(l.quantity);
  const rate = Number(l.unit_price);
  const gst = Number(l.gst_percentage);
  const base = qty * rate;
  return { base, gstAmt: base * gst / 100, total: base + base * gst / 100 };
};

const getFormat = () => localStorage.getItem('bill_format') || 'excel';

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billsApi.get(id)
      .then(res => setBill(res))
      .catch(() => {
        showToast('Failed to load bill details', 'error');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    try {
      const res = await billsApi.downloadUrl(id);
      // Axios interceptor unwraps response.data, so res IS the body
      const url = res.download_url || res.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        showToast('No file attached to this bill yet.', 'error');
      }
    } catch (err) {
      showToast('Failed to get download link', 'error');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="main-content">
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading…</div>
        </main>
      </>
    );
  }

  if (!bill) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="main-content">
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Bill not found</div>
        </main>
      </>
    );
  }

  const subtotal = bill.lineItems?.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_price), 0) || 0;
  const gstTotal = bill.lineItems?.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_price) * Number(l.gst_percentage) / 100, 0) || 0;
  const grandTotal = Number(bill.grand_total);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="main-content">
        <div className="breadcrumb">
          <a onClick={() => navigate('/portal')}>My Bills</a>
          <span className="breadcrumb-sep">›</span>
          <span>#{bill.invoice_no}</span>
        </div>

        <div className="pg-hdr">
          <div>
            <div className="pg-title">#{bill.invoice_no}</div>
            <div className="pg-sub">Issued {bill.bill_date} · Due {bill.due_date}</div>
          </div>
          <div className="pg-actions">
            <StatusBadge status={bill.payment_status === 'paid' ? 'paid' : bill.status} />
            {(bill.payment_status === 'unpaid' || bill.payment_status === 'proof_rejected') && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/portal/bills/${id}/pay`)}>
                💳 Submit Payment
              </button>
            )}
            <button className="btn btn-outline btn-sm" onClick={handleDownload}>
              <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download {getFormat() === 'csv' ? 'CSV' : 'Excel'}
            </button>
          </div>
        </div>

        <div className="form-layout">
          <div>
            <Card style={{ marginBottom: '1.25rem' }}>
              <CardHeader title="Line items" />
              <table>
                <thead>
                  <tr><th>#</th><th>Product</th><th>HSN</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {bill.lineItems?.map((l, i) => {
                    const t = lineTotal(l);
                    return (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{l.product_name}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{l.hsn_code}</td>
                        <td>{l.quantity} {l.unit}</td>
                        <td>Rs. {Number(l.unit_price).toLocaleString('en-IN')}</td>
                        <td><span className="badge b-blue">{l.gst_percentage}%</span></td>
                        <td style={{ fontWeight: 600 }}>Rs. {t.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Totals */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: 48, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>Rs. {subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', gap: 48, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-2)' }}>GST total</span>
                  <span style={{ fontWeight: 600 }}>Rs. {gstTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', gap: 48, fontSize: 16, fontWeight: 700, color: 'var(--text)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                  <span>Grand Total</span>
                  <span>Rs. {grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card style={{ marginBottom: '1.25rem' }}>
              <CardHeader title="Bill summary" />
              <div style={{ padding: '1.25rem 1.5rem' }}>
                {[
                  ['Invoice no.', `#${bill.invoice_no}`],
                  ['Customer', user?.name || 'Customer'],
                  ['Customer code', user?.customer?.customer_code || 'N/A'],
                  ['Bill date', bill.bill_date],
                  ['Due date', bill.due_date],
                  ['Total items', bill.lineItems?.length || 0],
                  ['Grand total', `Rs. ${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`],
                ].map(([k, v]) => (
                  <div key={k} className="setting-row">
                    <span className="setting-lbl" style={{ fontWeight: 500 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: k === 'Invoice no.' || k === 'Customer code' ? 'var(--mono)' : 'inherit' }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            {(bill.payment_status === 'unpaid' || bill.payment_status === 'proof_rejected') && (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                onClick={() => navigate(`/portal/bills/${id}/pay`)}>
                💳 Submit Payment Proof
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
