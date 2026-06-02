import React from 'react';
import { Modal } from './Modal';

export function DownloadFormatModal({ open, onClose, onDownload, downloadingFormat }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="card">
        <h3 className="card-title text-xl mb-4 text-center">Download Format</h3>
        <p className="text-gray-400 text-sm mb-6 text-center">
          Select the file format you'd like to download. 
          Generating a new format may take a few seconds.
        </p>

        <div className="grid gap-3">
          <button 
            className="btn btn-outline flex items-center justify-center gap-2 h-14"
            onClick={() => onDownload('pdf')}
            disabled={downloadingFormat !== null}
          >
            {downloadingFormat === 'pdf' ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
            )}
            Download PDF
          </button>

          <button 
            className="btn btn-outline flex items-center justify-center gap-2 h-14"
            onClick={() => onDownload('csv')}
            disabled={downloadingFormat !== null}
          >
            {downloadingFormat === 'csv' ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
            )}
            Download CSV
          </button>

          <button 
            className="btn btn-outline flex items-center justify-center gap-2 h-14"
            onClick={() => onDownload('excel')}
            disabled={downloadingFormat !== null}
          >
            {downloadingFormat === 'excel' ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
            )}
            Download Excel
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn btn-ghost" onClick={onClose} disabled={downloadingFormat !== null}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}
