import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const adminNav = [
  {
    label: 'Main',
    items: [
      { id: 'overview', label: 'Overview', path: '/dashboard', icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
      { id: 'customers', label: 'Customers', path: '/dashboard/customers', icon: <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
      { id: 'logins', label: 'Login Credentials', path: '/dashboard/logins', icon: <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
      { id: 'security', label: 'Security Logs', path: '/dashboard/security-logs', icon: <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
      { id: 'payments', label: 'Payment Proofs', path: '/dashboard/payments', badge: true, icon: <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
      { id: 'approvals', label: 'User Approvals', path: '/dashboard/approvals', badge: true, icon: <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16,11 18,13 22,9"/></svg> },
      { id: 'allbills', label: 'All Bills', path: '/dashboard/bills', icon: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
      { id: 'upload', label: 'Upload Bill', path: '/dashboard/bills/upload', icon: <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
    ],
  },
  {
    label: 'Automation',
    items: [
      { id: 'reminders', label: 'Reminder Engine', path: '/dashboard/reminders', icon: <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
      { id: 'addrule', label: 'Add Rule', path: '/dashboard/reminders/add', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'reports', label: 'Reports', path: '/dashboard/reports', icon: <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    ],
  },
];

const customerNav = [
  {
    label: 'My Account',
    items: [
      { id: 'bills', label: 'My Bills', path: '/portal', icon: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
      { id: 'preferences', label: 'Preferences', path: '/portal/preferences', icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    ],
  },
];

export function Sidebar({ pendingPayments = 0, pendingApprovals = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navGroups = user?.role === 'admin' ? adminNav : customerNav;

  const isActive = (path) => {
    if (path === '/dashboard' || path === '/portal' || path === '/dashboard/bills') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      {navGroups.map(group => (
        <div key={group.label}>
          <div className="sidebar-label">{group.label}</div>
          {group.items.map(item => (
            <button
              key={item.id}
              className={`sidebar-item${isActive(item.path) ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
              {item.id === 'payments' && pendingPayments > 0 && (
                <span className="sidebar-count">{pendingPayments}</span>
              )}
              {item.id === 'approvals' && pendingApprovals > 0 && (
                <span className="sidebar-count">{pendingApprovals}</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
