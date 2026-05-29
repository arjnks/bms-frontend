import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { customersApi } from '../../api/customers';

const fmtAmt = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

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
  
  // Outstanding is sum of unpaid bills
  const outstandingAmount = bills
    .filter(b => b.payment_status === 'unpaid' || b.payment_status === 'proof_rejected' || b.status === 'unpaid' || b.status === 'overdue')
    .reduce((sum, b) => sum + Number(b.grand_total), 0);

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
    </AppShell>
  );
}
