import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let toastQueue = [];
let toastListeners = [];

function notify(listeners) {
  listeners.forEach(fn => fn([...toastQueue]));
}

export function showToast(message, type = 'success') {
  const id = Date.now();
  toastQueue.push({ id, message, type });
  notify(toastListeners);
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    notify(toastListeners);
  }, 3500);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (ts) => setToasts(ts);
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter(l => l !== listener); };
  }, []);

  if (!toasts.length) return null;

  return createPortal(
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: 10, zIndex: 300 }}>
      {toasts.map(t => (
        <div key={t.id}
          className={`toast${t.type === 'error' ? ' toast-error' : t.type === 'warn' ? ' toast-warn' : ''}`}
          style={{ display: 'flex' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.type === 'error' ? '#f87171' : t.type === 'warn' ? '#fbbf24' : '#4ade80'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            {t.type === 'error'
              ? <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
              : t.type === 'warn'
              ? <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></>
              : <><circle cx="12" cy="12" r="10"/><polyline points="9,12 12,15 16,10"/></>}
          </svg>
          <span>{t.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
