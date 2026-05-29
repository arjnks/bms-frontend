import { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { authApi } from '../../api/auth';
import { StatusBadge } from '../../components/ui/Badge';

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});

export default function SecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await authApi.getLogs();
        setLogs(res.data?.data || res.data || []);
      } catch (err) {
        setError('Failed to load security logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <AppShell title="Security Logs">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Security Logs</div>
          <div className="pg-sub">Monitor all login attempts to your website</div>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <Card>
          <CardHeader title="Recent Login Attempts" />
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading logs...</div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Email / Username</th>
                    <th>IP Address</th>
                    <th>Device / Browser</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No login attempts found.
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(log.created_at)}</td>
                        <td style={{ fontWeight: 500 }}>{log.email}</td>
                        <td>{log.ip_address || '—'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.user_agent}>
                          {log.user_agent || '—'}
                        </td>
                        <td>
                          <StatusBadge 
                            status={log.status === 'success' ? 'Success' : 'Failed'}
                            type={log.status === 'success' ? 'success' : 'danger'}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
