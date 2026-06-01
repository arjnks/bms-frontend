import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card, CardHeader } from '../../components/ui/Card';
import { showToast } from '../../components/ui/Toast';
import { billsApi } from '../../api/bills';
import { useAuth } from '../../context/AuthContext';

const fmtCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExternalBillDetail() {
  const { billno } = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();

  const [items, setItems]       = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    billsApi.externalDetail(billno)
      .then(res => {
        setItems(res.data ?? []);
        setSummary(res.summary ?? null);
      })
      .catch(() => showToast('Failed to load bill details', 'error'))
      .finally(() => setLoading(false));
  }, [billno]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Get a signed Railway-direct URL (bypasses Vercel proxy — reliable for binary files)
      const res = await billsApi.externalGetDownloadUrl(billno);
      const url = res.download_url || res.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        showToast('Could not get download link.', 'error');
      }
    } catch {
      showToast('Download failed. Please try again.', 'error');
    } finally {
      setDownloading(false);
    }
  }, [billno]);


  if (loading) return (
    <>
      <Navbar /><Sidebar />
      <main className="main-content">
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading…</div>
      </main>
    </>
  );

  const netAmount = summary?.net_amount || items[0]?.NETAMOUNT || 0;
  const billNo    = summary?.bill_no    || items[0]?.BILLNO    || billno;
  const billDate  = summary?.bill_date  || items[0]?.BILLDATE  || '';
  const format    = user?.customer?.preferred_bill_format || 'excel';

  return (
    <>
      <Navbar /><Sidebar />
      <main className="main-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <a onClick={() => navigate('/portal')}>My Bills</a>
          <span className="breadcrumb-sep">›</span>
          <a onClick={() => navigate('/portal', { state: { tab: 'external' } })}>Bills by Date</a>
          <span className="breadcrumb-sep">›</span>
          <span>{billNo}</span>
        </div>

        {/* Page header */}
        <div className="pg-hdr">
          <div>
            <div className="pg-title">{billNo}</div>
            <div className="pg-sub">Issued {billDate} · {items.length} item{items.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="pg-actions">
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: 'var(--green-light)', color: 'var(--green)',
            }}>Live from ERP</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleDownload}
              disabled={downloading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {downloading ? (
                <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              )}
              Download {format === 'csv' ? 'CSV' : format === 'pdf' ? 'PDF' : 'Excel'}
            </button>
          </div>
        </div>

        <div className="form-layout">
          {/* Line items */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Card>
              <CardHeader title="Line Items" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ minWidth: 1100 }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Item Name</th>
                      <th>Company</th>
                      <th>Batch</th>
                      <th>Expiry</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Free</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>MRP</th>
                      <th style={{ textAlign: 'right' }}>Disc%</th>
                      <th style={{ textAlign: 'right' }}>Taxable</th>
                      <th style={{ textAlign: 'right' }}>GST%</th>
                      <th style={{ textAlign: 'right' }}>GST Val</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>HSN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-3)', fontSize: 11 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500, minWidth: 180 }}>{item.ITEMNAME}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{item.COMPNAME}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{item.BATCHNO}</td>
                        <td style={{ fontSize: 12 }}>{item.EXPIRYDATE}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.QUANTITY}</td>
                        <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 500 }}>{item.FREE || 0}</td>
                        <td style={{ textAlign: 'right' }}>{fmtCurrency(item.SRATE)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-2)' }}>{fmtCurrency(item.PMRP)}</td>
                        <td style={{ textAlign: 'right' }}>{item.DISCOUNT || 0}%</td>
                        <td style={{ textAlign: 'right' }}>{fmtCurrency(item.TAXABLE)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge b-blue">{item.GSTRATE}%</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{fmtCurrency(item.GSTVALUE)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>{fmtCurrency(item.TOTALAMOUNT)}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{item.HSNCODE}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Net amount footer */}
              <div style={{
                padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'flex-end', gap: 32, alignItems: 'center'
              }}>
                <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Net Amount</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{fmtCurrency(netAmount)}</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
