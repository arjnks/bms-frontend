import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { reportsApi } from '../../api/reports';
import { billsApi } from '../../api/bills';

const fmt = (v) => `Rs. ${(v / 100000).toFixed(1)}L`;
const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

export default function Reports() {
  const [aging, setAging] = useState(null);
  const [collections, setCollections] = useState([]);
  const [overview, setOverview] = useState(null);
  const [overdueBills, setOverdueBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      reportsApi.aging(),
      reportsApi.collections(),
      reportsApi.overview(),
      billsApi.adminList({ payment_status: 'unpaid' })
    ]).then(([agingRes, collRes, overRes, billsRes]) => {
      setAging(agingRes.data || agingRes);
      setCollections(collRes.data || collRes);
      setOverview(overRes.data || overRes);
      setOverdueBills((billsRes.data?.data || billsRes.data || billsRes).slice(0, 10)); // Top 10
    }).catch(err => {
      setError('Failed to load reports.');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading reports…</div>
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

  // Calculate percentages for aging
  const totalAgingAmt = aging['0_30_days'].total_amount + aging['31_60_days'].total_amount + aging['60_plus_days'].total_amount;
  
  const agingData = [
    { range: '0 – 30 days', amt: aging['0_30_days'].total_amount, bills: aging['0_30_days'].count, color: '#166534', pct: totalAgingAmt ? (aging['0_30_days'].total_amount / totalAgingAmt) * 100 : 0 },
    { range: '31 – 60 days', amt: aging['31_60_days'].total_amount, bills: aging['31_60_days'].count, color: '#b45309', pct: totalAgingAmt ? (aging['31_60_days'].total_amount / totalAgingAmt) * 100 : 0 },
    { range: '61+ days', amt: aging['60_plus_days'].total_amount, bills: aging['60_plus_days'].count, color: '#c0392b', pct: totalAgingAmt ? (aging['60_plus_days'].total_amount / totalAgingAmt) * 100 : 0 },
  ];

  // Map collections for Recharts
  const chartData = collections.map(c => ({
    month: new Date(c.month + '-01').toLocaleString('en-US', { month: 'short' }),
    collected: c.total_collected
  }));

  // Helper for Days Overdue
  const getDaysOverdue = (dueDate) => {
    const diff = new Date() - new Date(dueDate);
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <AppShell pendingPayments={0} pendingApprovals={0}>
      <div className="pg-hdr">
        <div><div className="pg-title">Reports</div><div className="pg-sub">Aging analysis, collection trends, and outstanding summaries</div></div>
        <div className="pg-actions">
          <button className="btn btn-outline btn-sm">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Aging grid */}
      <div className="aging-grid">
        {agingData.map(a => (
          <div key={a.range} className="aging-card">
            <div className="aging-range">{a.range}</div>
            <div className="aging-amt" style={{ color: a.color }}>{formatCurrency(a.amt)}</div>
            <div className="aging-cnt">{a.bills} bills outstanding</div>
            <div className="aging-bar">
              <div className="aging-bar-fill" style={{ width: `${a.pct}%`, background: a.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="reports-charts">
        <div className="chart-card">
          <div className="chart-hdr">
            <div><div className="chart-title">Monthly Collections</div><div className="chart-sub">Rs.  Collected - last 12 months</div></div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Collected']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{v}</span>} />
                <Bar dataKey="collected" name="Collected" fill="#166534" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-hdr">
            <div><div className="chart-title">Summary</div><div className="chart-sub">Current period snapshot</div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Total outstanding', value: formatCurrency(overview?.total_outstanding || 0), color: 'var(--red)' },
              { label: 'Bills sent today', value: overview?.bills_today || 0, color: '#166534' },
              { label: 'Overdue accounts', value: overview?.overdue_count || 0, color: 'var(--red)' },
              { label: 'Collection rate', value: `${overview?.collection_rate || 0}%`, color: '#166534' },
              { label: 'Reminders this month', value: overview?.reminders_this_month || 0, color: 'var(--amber)' },
            ].map(row => (
              <div key={row.label} className="setting-row" style={{ padding: '10px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{row.label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue table */}
      <Card>
        <CardHeader title="Overdue Bills Detail" subtitle="Recent unpaid bills" />
        {overdueBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-2)' }}>No overdue bills found.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Customer</th><th>Outstanding</th><th>Bill Date</th><th>Days overdue</th><th>Status</th></tr>
            </thead>
            <tbody>
              {overdueBills.map(r => {
                const days = getDaysOverdue(r.due_date);
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="cust-cell">
                        <div className="cust-av" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
                          {r.customer_name?.split(' ').map(n => n[0]).join('').slice(0,2) || '??'}
                        </div>
                        <div>
                          <div className="cust-name">{r.customer_name}</div>
                          <div className="cust-id">{r.invoice_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="amt-red">{formatCurrency(r.grand_total)}</td>
                    <td style={{ fontSize: 13 }}>{r.bill_date}</td>
                    <td><span className="badge b-red">{days > 0 ? `${days}d overdue` : 'Due today/soon'}</span></td>
                    <td><span className="badge b-red">Unpaid</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
