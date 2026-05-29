import { useState, useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';
import { showToast } from '../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { remindersApi } from '../../api/reminders';

const CHANNEL_COLORS = { WhatsApp: 'ch-wa', SMS: 'ch-sms', Email: 'ch-email' };

export default function Reminders() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupOn, setPopupOn] = useState(true);
  const [threshold, setThreshold] = useState(1000);
  const [freq, setFreq] = useState('every_login');
  const [sendTime, setSendTime] = useState('09:00');
  const navigate = useNavigate();

  const fetchRules = () => {
    setLoading(true);
    remindersApi.list()
      .then(res => setRules(res.data || res))
      .catch(err => setError('Failed to load rules.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggle = async (id, currentStatus) => {
    try {
      setRules(rs => rs.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
      await remindersApi.toggle(id, !currentStatus);
      showToast(`Rule ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (err) {
      showToast('Failed to toggle rule', 'error');
      setRules(rs => rs.map(r => r.id === id ? { ...r, is_active: currentStatus } : r));
    }
  };

  const saveSettings = () => showToast('✓ Portal popup settings saved');

  const getIcon = (type) => {
    if (type === 'before_due') return { icon: '🔔', iconBg: '#fef9ec', iconColor: '#b45309' };
    if (type === 'on_due') return { icon: '⏰', iconBg: '#fdf2f2', iconColor: '#c0392b' };
    if (type === 'after_due') return { icon: '🚨', iconBg: '#fdf2f2', iconColor: '#c0392b' };
    return { icon: '📅', iconBg: 'var(--gray-4)', iconColor: 'var(--gray-2)' };
  };

  if (loading && rules.length === 0) {
    return (
      <AppShell>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>Loading rules…</div>
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
          <div className="pg-title">Reminder Engine</div>
          <div className="pg-sub">Set rules once — runs automatically. No manual work needed.</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard/reminders/add')}>
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add new rule
        </button>
      </div>

      <div className="two-col" style={{ marginBottom: '1.5rem' }}>
        {/* Rules */}
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="Automated rules" subtitle="Click toggle to enable / disable"
            actions={<span style={{ fontSize: 12, fontWeight: 600, color: '#166534', background: 'var(--green-light)', padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(22,101,52,.2)' }}>
              {rules.filter(r => r.is_active).length} active
            </span>}
          />
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {rules.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '1rem' }}>No rules configured.</div>
            ) : (
              rules.map(r => {
                const { icon, iconBg } = getIcon(r.trigger_type);
                const channelLabel = r.channel || 'whatsapp';
                return (
                  <div key={r.id} className="rule-item" style={{ opacity: r.is_active ? 1 : .6 }}>
                    <div className="rule-icon" style={{ background: iconBg }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="rule-title" style={{ color: r.is_active ? 'var(--text)' : 'var(--text-2)' }}>
                        {r.trigger_type.replace(/_/g, ' ')} {r.offset_days > 0 ? `(${r.offset_days} days)` : ''}
                      </div>
                      <div className="rule-desc">
                        Sends at {r.send_time?.slice(0,5)}&nbsp;&nbsp;
                        <span className={`ch-tag ${CHANNEL_COLORS[channelLabel.charAt(0).toUpperCase() + channelLabel.slice(1)] || 'ch-wa'}`}>{channelLabel}</span>
                      </div>
                    </div>
                    <div className="rule-right">
                      <Switch on={r.is_active} onToggle={() => toggle(r.id, r.is_active)} />
                      <span className={`sw-lbl ${r.is_active ? 'on' : 'off'}`}>{r.is_active ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Portal popup settings */}
        <Card style={{ marginBottom: 0 }}>
          <CardHeader title="Portal popup settings" subtitle="Shown to customer on login"
            actions={<Switch on={popupOn} onToggle={() => setPopupOn(p => !p)} />}
          />
          <div style={{ padding: '1.25rem 1.5rem' }}>
            <div className="setting-row">
              <div><div className="setting-lbl">Trigger threshold</div><div className="setting-hint">Show popup if outstanding ≥ this amount</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input className="ctrl" type="number" value={threshold} onChange={e => setThreshold(e.target.value)} style={{ width: 100 }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Rs. </span>
              </div>
            </div>
            <div className="setting-row">
              <div><div className="setting-lbl">Popup frequency</div><div className="setting-hint">How often to show per customer</div></div>
              <select className="ctrl" value={freq} onChange={e => setFreq(e.target.value)}>
                <option value="every_login">Every login</option>
                <option value="once_per_day">Once per day</option>
                <option value="once_per_week">Once per week</option>
              </select>
            </div>
            <div className="setting-row">
              <div><div className="setting-lbl">Send time</div><div className="setting-hint">Time of day for scheduled WhatsApp alerts</div></div>
              <input className="ctrl" type="time" value={sendTime} onChange={e => setSendTime(e.target.value)} style={{ width: 110 }} />
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={saveSettings}>
                Save settings
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
