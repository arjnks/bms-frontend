import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardHeader } from '../../components/ui/Card';
import { showToast } from '../../components/ui/Toast';
import { remindersApi } from '../../api/reminders';

const TRIGGERS = [
  { id: 'before_due', title: 'Before due date', desc: 'Send X days before payment is due' },
  { id: 'on_due', title: 'On due date', desc: 'Send on the exact due date' },
  { id: 'after_due', title: 'After due date', desc: 'Send X days after if still unpaid' },
  { id: 'weekly_overdue', title: 'Weekly (if overdue)', desc: 'Send every Monday for all overdue bills' },
];

const PREVIEW = {
  before_due: `Dear {{customer_name}},\n\nThis is a friendly reminder that invoice {{invoice_no}} for ₹{{amount}} is due on {{due_date}}.\n\nPlease ensure timely payment to avoid disruption.\n\n— Leo Group`,
  on_due: `Dear {{customer_name}},\n\nYour payment of ₹{{amount}} for invoice {{invoice_no}} is due TODAY.\n\nPlease clear your dues immediately.\n\n— Leo Group`,
  after_due: `Dear {{customer_name}},\n\nYour invoice {{invoice_no}} for ₹{{amount}} is now OVERDUE (due: {{due_date}}).\n\nPlease pay urgently or contact us.\n\n— Leo Group`,
  weekly_overdue: `Dear {{customer_name}},\n\nWeekly reminder: You have an outstanding balance of ₹{{amount}} on invoice {{invoice_no}}.\n\nPlease settle at the earliest.\n\n— Leo Group`,
};

export default function AddRule() {
  const navigate = useNavigate();
  const [trigger, setTrigger] = useState('before_due');
  const [offset, setOffset] = useState(3);
  const [channel, setChannel] = useState('whatsapp');
  const [time, setTime] = useState('09:00');
  const [template, setTemplate] = useState(PREVIEW.before_due);
  const [loading, setLoading] = useState(false);

  const handleTriggerChange = (id) => {
    setTrigger(id);
    setTemplate(PREVIEW[id]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!channel) { showToast('Select a channel.', 'warn'); return; }
    
    setLoading(true);
    try {
      await remindersApi.create({
        trigger_type: trigger,
        offset_days: offset,
        send_time: time,
        channel: channel,
        message_template: template,
        is_active: true
      });
      showToast('✓ Reminder rule created successfully');
      navigate('/dashboard/reminders');
    } catch (err) {
      showToast(err?.message || 'Failed to create rule', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell pendingPayments={0} pendingApprovals={0}>
      <div className="breadcrumb">
        <a onClick={() => navigate('/dashboard/reminders')}>Reminder Engine</a>
        <span className="breadcrumb-sep">›</span>
        <span>Add Rule</span>
      </div>
      <div className="pg-hdr">
        <div><div className="pg-title">Add Reminder Rule</div><div className="pg-sub">Create a new automated notification trigger</div></div>
      </div>

      <form onSubmit={submit}>
        <div className="form-layout">
          {/* Left */}
          <div>
            <Card style={{ marginBottom: '1.25rem' }}>
              <CardHeader title="Trigger type" />
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div className="trigger-options">
                  {TRIGGERS.map(t => (
                    <label key={t.id} className={`trigger-card${trigger === t.id ? ' selected' : ''}`} onClick={() => handleTriggerChange(t.id)}>
                      <input type="radio" name="trigger" value={t.id} />
                      <div className="tc-title">{t.title}</div>
                      <div className="tc-desc">{t.desc}</div>
                    </label>
                  ))}
                </div>
                {(trigger === 'before_due' || trigger === 'after_due') && (
                  <div className="form-group">
                    <label className="form-label">Days offset</label>
                    <input className="form-ctrl" type="number" min="1" max="30" value={offset}
                      onChange={e => setOffset(e.target.value)} style={{ width: 120 }} />
                    <div className="form-hint">{trigger === 'before_due' ? 'Days before due date to send' : 'Days after due date to send'}</div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Send time</label>
                  <input className="form-ctrl" type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: 140 }} />
                  <div className="form-hint">Time of day to send the reminder</div>
                </div>
              </div>
            </Card>

            <Card style={{ marginBottom: '1.25rem' }}>
              <CardHeader title="Notification channel" />
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div className="channel-options">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', desc: 'Via Meta Cloud API — instant delivery', emoji: '💬' },
                    { id: 'popup', label: 'Portal popup', desc: 'Shown when customer logs in', emoji: '🔔' },
                  ].map(ch => (
                    <label key={ch.id} className={`channel-opt${channel === ch.id ? ' selected' : ''}`} onClick={() => setChannel(ch.id)}>
                      <input type="radio" name="channel" value={ch.id} />
                      <span style={{ fontSize: 18 }}>{ch.emoji}</span>
                      <div>
                        <div className="co-title">{ch.label}</div>
                        <div className="co-desc">{ch.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard/reminders')}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                <svg viewBox="0 0 24 24"><polyline points="20,6 9,17 4,12"/></svg>
                {loading ? 'Creating…' : 'Create Rule'}
              </button>
            </div>
          </div>

          {/* Right: preview */}
          <div>
            <Card style={{ marginBottom: 0 }}>
              <CardHeader title="Message preview" />
              <div style={{ padding: '1.25rem 1.5rem' }}>
                <div className="info-box">
                  Variables in <code style={{ fontFamily: 'var(--mono)' }}>{'{{double_braces}}'}</code> are replaced automatically from your bill data.
                </div>
                {channel === 'whatsapp' && (
                  <>
                    <span className="preview-chip pc-wa">WhatsApp</span>
                    <div className="preview-msg">{template}</div>
                  </>
                )}
                {channel === 'popup' && (
                  <>
                    <span className="preview-chip" style={{ background: '#ede9fe', color: '#5b21b6', marginTop: 12, display: 'inline-block' }}>Portal Popup</span>
                    <div className="preview-msg" style={{ marginTop: 8 }}>{template}</div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
