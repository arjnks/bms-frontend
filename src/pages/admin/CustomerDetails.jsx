import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { DownloadFormatModal } from '../../components/ui/DownloadFormatModal';
import { customersApi } from '../../api/customers';
import api from '../../api/axios';

const fmtAmt = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const getExtStatus = (b) => {
  const settled = b.settled || b.SETTLED;
  if (settled === 'Y') return 'paid';
  const dateStr = b.date || b.DATE;
  const lockdays = b.lockdays || b.LOCKDAYS || 0;
  if (dateStr && lockdays) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + parseInt(lockdays, 10));
    if (d < new Date()) return 'overdue';
  }
  return 'unpaid';
};

const getExtDueDate = (b) => {
  const dateStr = b.date || b.DATE;
  const lockdays = b.lockdays || b.LOCKDAYS || 0;
  if (dateStr && lockdays) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + parseInt(lockdays, 10));
    return d.toISOString().split('T')[0];
  }
  return null;
};

const getExtDueAmt = (b) => {
  const net = parseFloat(b.netamount || b.NETAMOUNT || 0);
  const rec = parseFloat(b.amtreceived || b.AMTRECEIVED || 0);
  return net - rec;
};

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [modalBillNo, setModalBillNo] = useState(null);

  const [tab, setTab] = useState('local');
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 2); return d.toISOString().slice(0, 10); });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [extBills, setExtBills] = useState([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extFetched, setExtFetched] = useState(false);

  const fetchExternal = async () => {
    if (!customer?.external_cucode) return;
    setExtLoading(true);
    setExtFetched(true);
    try {
      const res = await customersApi.externalBills(id, { from_date: fromDate, to_date: toDate });
      setExtBills(res.data ?? []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to fetch live bills', 'error');
    } finally {
      setExtLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'external' && customer?.external_cucode && !extFetched) {
      fetchExternal();
    }
  }, [tab, customer, extFetched]);

  const handleExtDownload = async (selectedFormat) => {
    if (!modalBillNo) return;
    try {
      setDownloadingFormat(selectedFormat);
      showToast('Preparing download...', 'info');
      const safeBillno = String(modalBillNo).replace(/[/\\]/g, '-');

      const res = await api.get(`/admin/customers/${id}/external-bills/${encodeURIComponent(safeBillno)}/download${selectedFormat ? `?format=${selectedFormat}` : ''}`);
      if (res && res.download_url) {
        window.open(res.download_url, '_blank');
        showToast('Download complete!', 'success');
      } else {
        throw new Error('No download URL returned');
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast(`Download failed: ${err.message || 'Network error'}`, 'error');
    } finally {
      setDownloadingFormat(null);
      setModalBillNo(null);
    }
  };


  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const res = await customersApi.get(id);
        setCustomer(res.data || res);
      } catch (err) {
        setError('Failed to load customer details.');
      } finally {
        setLoading(false);
      }
    };
    loadCustomer();
  }, [id]);

  const handleRemind = async () => {
    setActing(true);
    try {
      await customersApi.remind(id);
      showToast('Reminder sent successfully');
      // Refresh customer data
      const res = await customersApi.get(id);
      setCustomer(res.data || res);
    } catch (err) {
      showToast('Failed to send reminder', 'error');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Customer Details">
        <div className="p-4" style={{ color: 'var(--text-secondary)' }}>Loading customer...</div>
      </AppShell>
    );
  }

  if (error || !customer) {
    return (
      <AppShell title="Customer Details">
        <div className="p-4" style={{ color: 'var(--danger)' }}>{error || 'Customer not found.'}</div>
        <div className="px-4">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard/customers')}>Back to Customers</button>
        </div>
      </AppShell>
    );
  }

  const user = customer.user || {};
  const bills = customer.bills || [];
  
  // Use server-computed outstanding amount for accuracy (includes partial payments and historical dues)
  const outstandingAmount = customer.outstanding_amount ?? bills
    .filter(b => !b.is_settled)
    .reduce((sum, b) => sum + Math.max(0, Number(b.grand_total) - Number(b.amount_received ?? 0)), 0);

  return (
    <AppShell title="Customer Details">
      <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard/customers')}>
          &larr; Back
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {user.name}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', padding: '0 1.5rem', marginBottom: '2rem' }}>
        <Card>
          <CardHeader title="Contact Info" />
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.email || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Phone (WhatsApp)</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user.phone || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ERP Code</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customer.external_cucode || '-'}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Account Status" />
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Bills</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{bills.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Outstanding Dues</span>
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmtAmt(outstandingAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleRemind}
                disabled={acting || outstandingAmount <= 0}
              >
                {acting ? 'Sending...' : 'Send WhatsApp Reminder'}
              </button>
            </div>
          </div>
        </Card>
      </div>

      
      <div style={{ padding: '0 1.5rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => setTab('local')} style={{ padding: '8px 4px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: 'none', color: tab === 'local' ? 'var(--blue)' : 'var(--text-secondary)', borderBottom: tab === 'local' ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1 }}>Imported Bills</button>
        <button onClick={() => setTab('external')} style={{ padding: '8px 4px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: 'none', color: tab === 'external' ? 'var(--blue)' : 'var(--text-secondary)', borderBottom: tab === 'external' ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1 }}>Live ERP Bills</button>
      </div>

      {tab === 'local' && (
      <div style={{ padding: '0 1.5rem' }}>
        <Card>
          <CardHeader title="Bills History" />
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No bills found for this customer.
                    </td>
                  </tr>
                ) : (
                  bills.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 500 }}>{b.invoice_no}</td>
                      <td>{b.bill_date ? fmtDate(b.bill_date) : '-'}</td>
                      <td>{b.due_date ? fmtDate(b.due_date) : '-'}</td>
                      <td style={{ fontWeight: 600 }}>{fmtAmt(b.grand_total)}</td>
                      <td>
                        <StatusBadge 
                          status={b.payment_status} 
                          type={
                            b.payment_status === 'paid' ? 'success' :
                            b.payment_status === 'unpaid' ? 'danger' :
                            b.payment_status === 'payment_submitted' ? 'warning' : 'default'
                          } 
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}

      {tab === 'external' && (
      <div style={{ padding: '0 1.5rem' }}>
        {!customer.external_cucode ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Customer is not linked to ERP billing system.</div>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => fetchExternal()} disabled={extLoading}>
                {extLoading ? 'Loading...' : 'Fetch Bills'}
              </button>
            </div>
            {extFetched && (
            <Card>
              <CardHeader title={`ERP Bills (${extBills.length})`} />
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr><th>Bill No.</th><th>Date</th><th>Due Date</th><th>Due Amount</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {extLoading ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                    ) : extBills.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No bills found in this date range.</td></tr>
                    ) : (
                      extBills.map((b, i) => {
                        const status = getExtStatus(b);
                        const dueDate = getExtDueDate(b);
                        const dueAmt = getExtDueAmt(b);
                        const dateStr = b.date || b.DATE;
                        const billNo = b.billno || b.BILLNO || b.BN;
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{billNo}</td>
                            <td>{dateStr ? fmtDate(dateStr) : '-'}</td>
                            <td>{dueDate ? fmtDate(dueDate) : '-'}</td>
                            <td style={{ fontWeight: 600 }}>{fmtAmt(dueAmt)}</td>
                            <td>
                              <StatusBadge 
                                status={status} 
                                type={
                                  status === 'paid' ? 'success' :
                                  status === 'overdue' ? 'danger' : 'warning'
                                } 
                              />
                            </td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => setModalBillNo(billNo)}>Download Bill</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
            )}
          </>
        )}
      </div>
      )}

      <DownloadFormatModal 
        open={!!modalBillNo} 
        onClose={() => setModalBillNo(null)} 
        onDownload={handleExtDownload}
        downloadingFormat={downloadingFormat}
      />
    </AppShell>
  );
}
