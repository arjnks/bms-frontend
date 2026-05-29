import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { showToast } from '../../components/ui/Toast';
import { billsApi } from '../../api/bills';

const fmtAmt = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

export default function AdminBills() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p };
      if (statusFilter !== 'all') {
        params.payment_status = statusFilter;
      }
      const res = await billsApi.adminList(params);
      setBills(res.data || res);
      setMeta({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
      });
    } catch (err) {
      setError('Failed to load bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page, statusFilter]);

  const filtered = bills.filter(b =>
    b.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = {
    paid: 'amt-green',
    unpaid: 'amt-red',
    payment_submitted: 'amt-amber',
    proof_rejected: 'amt-red',
  };

  if (loading && bills.length === 0) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading bills…</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>{error}</div>
      </AppShell>
    );
  }

  return (
    <AppShell pendingPayments={0} pendingApprovals={0}>
      <div className="pg-hdr">
        <div>
          <div className="pg-title">All Bills</div>
          <div className="pg-sub">
            {meta?.total ? `${meta.total} total bills` : `${bills.length} bills`}
          </div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/bills/upload')}>
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Upload Bill
          </button>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Bill History"
          actions={
            <div className="toolbar">
              <input type="text" placeholder="Search invoice or customer…" value={search} onChange={e => setSearch(e.target.value)} />
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="all">All status</option>
                <option value="unpaid">Unpaid</option>
                <option value="payment_submitted">Proof submitted</option>
                <option value="proof_rejected">Proof rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          }
        />
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No bills found</div>
            <div style={{ fontSize: 13, marginTop: 4, marginBottom: 16 }}>Upload the first bill to get started</div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/bills/upload')}>Upload Bill</button>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Bill Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Format</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td className="bill-no">#{b.invoice_no}</td>
                    <td>
                      <div className="cust-cell">
                        <div className="cust-av" style={{ background: 'var(--blue-light)', color: 'var(--blue-dark)' }}>
                          {b.customer_name?.split(' ').map(n => n[0]).join('').slice(0,2) ?? '??'}
                        </div>
                        <div>
                          <div className="cust-name">{b.customer_name ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{b.bill_date}</td>
                    <td style={{ fontSize: 13 }}>{b.due_date}</td>
                    <td className={statusColor[b.payment_status] ?? ''} style={{ fontWeight: 600 }}>
                      {fmtAmt(b.grand_total)}
                    </td>
                    <td>
                      <span className={`badge ${b.bill_file_type === 'csv' ? 'b-blue' : 'b-green'}`}
                        style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                        {b.bill_file_type?.toUpperCase() ?? '—'}
                      </span>
                    </td>
                    <td><StatusBadge status={b.payment_status} /></td>
                    <td>
                      <div className="act-btns">
                        {b.payment_status === 'payment_submitted' && (
                          <button className="btn-xs"
                            onClick={() => navigate('/dashboard/payments')}
                            style={{ background: 'var(--amber-light)', color: 'var(--amber)', borderColor: 'rgba(180,83,9,.25)' }}>
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '1rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}>
                  Page {meta.current_page} of {meta.last_page}
                </span>
                <button className="btn btn-outline btn-sm" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </Card>
    </AppShell>
  );
}
