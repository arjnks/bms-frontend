import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export function Navbar({ outstandingAmt }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <nav className="nav">
      <div className="nav-left">
        <img src="/leo-logo.png" alt="Leo Group" className="nav-logo" />
        <div className="nav-divider" />
        <div>
          <div className="nav-app-name">Bill Management System</div>
          <div className="nav-app-sub">Leo Group · Since 1974</div>
        </div>
      </div>
      <div className="nav-right">
        {outstandingAmt && (
          <span className="outstanding-badge">₹{outstandingAmt} outstanding</span>
        )}
        <button className="nav-btn" title="Notifications" aria-label="Notifications">
          <svg viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="notif-dot" />
        </button>
        <button className="nav-btn" onClick={toggle} title="Toggle dark / light mode" aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" className="icon-sun">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="icon-moon">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        <div className="avatar-nav" onClick={logout} title={`${user?.name} — click to logout`}>
          {initials}
        </div>
      </div>
    </nav>
  );
}
