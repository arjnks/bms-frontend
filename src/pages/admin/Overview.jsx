import { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { KpiCard } from '../../components/ui/KpiCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { CollectionsChart } from '../../components/charts/CollectionsChart';
import { PaymentStatusChart } from '../../components/charts/PaymentStatusChart';
import { StatusBadge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reports';

export default function Overview() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    reportsApi.overview()
      .then(res => setData(res))
      .catch(err => setError('Failed to load overview data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: 40, textAlign: 'center' }}>Loading overview...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div style={{ padding: 40, textAlign: 'center' }}>No overview data available.</div>
      </AppShell>
    );
  }

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  const duesThisMonth = data.dues_this_month ?? data.total_outstanding ?? 0;
  const overdueAmount = data.overdue_amount ?? 0;

  return (
    <AppShell pendingPayments={0} pendingApprovals={0}>
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Overview Dashboard</div>
          <div className="pg-sub">{today} · Leo Group, Thrissur</div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-outline btn-sm">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Report
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/bills/upload')}>
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Upload Bills
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard variant="red" value={formatCurrency(duesThisMonth)} label="Total Outstanding Dues" change={`${data.dues_this_month_count ?? data.total_unpaid ?? 0} bills due`} changeType="dn"
          icon={<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <KpiCard variant="blue" value={data.bills_today.toString()} label="Bills Sent Today" change="Live Data" changeType="up"
          icon={<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>} />
        <KpiCard variant="amber" value={data.overdue_count.toString()} label="Overdue Bills" change={formatCurrency(overdueAmount)} changeType="dn"
          icon={<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
        <KpiCard variant="green" value={`${data.collection_rate}%`} label="Collection Rate" change="Live Data" changeType="up"
          icon={<svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>} />
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-hdr">
            <div><div className="chart-title">Monthly Collections</div><div className="chart-sub">Rs.  collected per month</div></div>
            <select className="ctrl" style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8 }}>
              <option>Last 12 months</option>
            </select>
          </div>
          <div className="chart-wrap"><CollectionsChart data={data.chart_collections} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-hdr"><div><div className="chart-title">Payment Status</div><div className="chart-sub">System wide overview</div></div></div>
          <div className="chart-wrap"><PaymentStatusChart data={data.chart_payment_status} /></div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="bottom-row">
        <Card>
          <CardHeader title="Recent Activity" actions={<span style={{ fontSize: 12, color: 'var(--text-2)' }}>Live</span>} />
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-2)' }}>No recent activity to show.</div>
        </Card>
        <Card>
          <CardHeader title="Top Overdue Accounts"
            actions={<button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/customers')}>View all →</button>} />
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-2)' }}>No overdue accounts to highlight.</div>
        </Card>
      </div>
    </AppShell>
  );
}
