import { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { KpiCard } from '../../components/ui/KpiCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { CollectionsChart } from '../../components/charts/CollectionsChart';
import { PaymentStatusChart } from '../../components/charts/PaymentStatusChart';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reports';

const fmtAmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const statusMeta = {
  paid:            { label: 'Paid',     cls: 'b-green' },
  unpaid:          { label: 'Unpaid',   cls: 'b-amber' },
  overdue:         { label: 'Overdue',  cls: 'b-red'   },
  proof_submitted: { label: 'Proof',    cls: 'b-blue'  },
  proof_rejected:  { label: 'Rejected', cls: 'b-red'   },
};

function StatusBadge({ status }) {
  const meta = statusMeta[status] ?? { label: status ?? 'Unknown', cls: 'b-blue' };
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

// Recent Activity row
function ActivityRow({ bill, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 20px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'var(--blue-light)', color: 'var(--blue)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 13,
      }}>
        {(bill.customer_name ?? '?')[0].toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {bill.customer_name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
          {bill.invoice_no} · {bill.bill_date} · <span style={{ color: 'var(--text-2)' }}>{bill.updated_at}</span>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <span className={bill.due_amount > 0 ? 'amt-red' : 'amt-green'} style={{ fontSize: 13 }}>
          {fmtAmt(bill.due_amount)}
        </span>
        <StatusBadge status={bill.payment_status} />
      </div>
    </div>
  );
}

// Top Overdue row
function OverdueRow({ account, rank, onClick }) {
  const barPct = Math.min(100, (account.total_due / 500000) * 100); // scale bar to 5L
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 20px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Rank badge */}
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: rank === 1 ? 'var(--red)' : rank === 2 ? 'var(--amber)' : 'var(--border)',
          color: rank <= 2 ? '#fff' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>
          {rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {account.customer_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
            {account.bill_count} overdue bill{account.bill_count !== 1 ? 's' : ''}
          </div>
        </div>

        <span className="amt-red" style={{ fontSize: 13, flexShrink: 0 }}>
          {fmtAmt(account.total_due)}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 6, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: rank === 1 ? 'var(--red)' : rank === 2 ? 'var(--amber)' : 'var(--blue)',
          width: `${barPct}%`,
          transition: 'width .4s ease',
        }} />
      </div>
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    reportsApi.overview()
      .then(res => setData(res))
      .catch(() => setError('Failed to load overview data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell><div style={{ padding: 40, textAlign: 'center' }}>Loading overview...</div></AppShell>;
  if (error)   return <AppShell><div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error}</div></AppShell>;
  if (!data)   return <AppShell><div style={{ padding: 40, textAlign: 'center' }}>No overview data available.</div></AppShell>;

  const duesThisMonth  = data.dues_this_month ?? data.total_outstanding ?? 0;
  const overdueAmount  = data.overdue_amount ?? 0;
  const recentBills    = data.recent_bills   ?? [];
  const topOverdue     = data.top_overdue    ?? [];

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
        <KpiCard variant="red" value={fmtAmt(duesThisMonth)} label="Total Outstanding Dues"
          change={`${data.dues_this_month_count ?? data.total_unpaid ?? 0} bills due`} changeType="dn"
          icon={<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <KpiCard variant="blue" value={(data.bills_today ?? 0).toString()} label="Bills Sent Today" change="Live Data" changeType="up"
          icon={<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>} />
        <KpiCard variant="amber" value={(data.overdue_count ?? 0).toString()} label="Overdue Bills"
          change={fmtAmt(overdueAmount)} changeType="dn"
          icon={<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} />
        <KpiCard variant="green" value={`${data.collection_rate ?? 0}%`} label="Collection Rate" change="Live Data" changeType="up"
          icon={<svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>} />
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-hdr">
            <div><div className="chart-title">Monthly Collections</div><div className="chart-sub">Rs. collected per month</div></div>
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
        {/* Recent Activity */}
        <Card>
          <CardHeader
            title="Recent Activity"
            actions={<span style={{ fontSize: 12, color: 'var(--text-2)' }}>Live</span>}
          />
          {recentBills.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No recent activity to show.
            </div>
          ) : (
            <div>
              {recentBills.map(bill => (
                <ActivityRow
                  key={bill.id}
                  bill={bill}
                  onClick={() => navigate(`/dashboard/customers/${bill.customer_id}`)}
                />
              ))}
              <div style={{ padding: '10px 20px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/dashboard/bills')}
                >
                  View all bills →
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Top Overdue Accounts */}
        <Card>
          <CardHeader
            title="Top Overdue Accounts"
            actions={
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard/customers')}>
                View all →
              </button>
            }
          />
          {topOverdue.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <svg viewBox="0 0 24 24" style={{ width: 32, height: 32, marginBottom: 8, opacity: .35, display: 'block', margin: '0 auto 8px' }}>
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              No overdue accounts — all payments are up to date!
            </div>
          ) : (
            <div>
              {topOverdue.map((account, i) => (
                <OverdueRow
                  key={account.customer_id}
                  account={account}
                  rank={i + 1}
                  onClick={() => navigate(`/dashboard/customers/${account.customer_id}`)}
                />
              ))}
              <div style={{ padding: '10px 20px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/dashboard/customers')}
                >
                  View all customers →
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
