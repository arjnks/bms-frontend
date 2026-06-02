import React from 'react';
import { Modal } from './Modal';

export function DownloadFormatModal({ open, onClose, onDownload, downloadingFormat }) {
  const formats = [
    { 
      id: 'pdf', 
      label: 'Download PDF', 
      desc: 'Standard format for viewing and printing',
      color: '#ef4444', 
      bg: '#fef2f2',
      icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    },
    { 
      id: 'excel', 
      label: 'Download Excel', 
      desc: 'Native spreadsheet (.xlsx)',
      color: '#10b981', 
      bg: '#ecfdf5',
      icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><rect x="8" y="13" width="8" height="4"></rect><line x1="12" y1="13" x2="12" y2="17"></line></svg>
    },
    { 
      id: 'csv', 
      label: 'Download CSV', 
      desc: 'Raw comma-separated values',
      color: '#3b82f6', 
      bg: '#eff6ff',
      icon: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="8.01" y2="13"></line><line x1="12" y1="13" x2="12.01" y2="13"></line><line x1="16" y1="13" x2="16.01" y2="13"></line></svg>
    }
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '2rem', maxWidth: '420px', width: '100%', background: 'var(--surface)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Download Format</h3>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>
            Select the file format you would like to download.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {formats.map(f => {
            const isDownloading = downloadingFormat === f.id;
            const isDisabled = downloadingFormat !== null;
            
            return (
              <button 
                key={f.id}
                onClick={() => onDownload(f.id)}
                disabled={isDisabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isDisabled && !isDownloading ? 0.5 : 1,
                  textAlign: 'left'
                }}
                onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.borderColor = f.color; }}
                onMouseLeave={e => { if (!isDisabled) e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  background: f.bg, color: f.color, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  {isDownloading ? (
                    <span style={{ width: 18, height: 18, border: `2.5px solid ${f.color}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  ) : (
                    f.icon
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>{f.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{f.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            className="btn btn-ghost" 
            onClick={onClose} 
            disabled={downloadingFormat !== null}
            style={{ width: '100%', justifyContent: 'center', color: 'var(--text-2)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
