import api from './axios';

export const billsApi = {
  // ── Admin ──────────────────────────────────────────────────────────────────
  adminList: (params) => api.get('/admin/bills', { params }),
  upload:    (formData) => api.post('/admin/bills', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markPaid:  (id) => api.post(`/admin/bills/${id}/mark-paid`),
  revert:    (id) => api.post(`/admin/bills/${id}/revert`),
  verifyPayment: (id) => api.post(`/admin/bills/${id}/verify-payment`),
  rejectPayment: (id, reason) => api.post(`/admin/bills/${id}/reject-payment`, { rejection_reason: reason }),

  // ── Customer (manual upload bills) ────────────────────────────────────────
  list:    (params) => api.get('/customer/bills', { params }),
  get:     (id)     => api.get(`/customer/bills/${id}`),
  downloadUrl: (id, format) => api.get(`/customer/bills/${id}/download${format ? `?format=${format}` : ''}`),
  submitPaymentProof: (id, formData) =>
    api.post(`/customer/bills/${id}/submit-payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ── External Bills (live from company ERP) ────────────────────────────────
  // List bills by date range - from_date and to_date as 'YYYY-MM-DD'
  externalList:   (params) => api.get('/customer/external-bills', { params }),
  // Get line items for a bill (numeric BILLNO)
  externalDetail: (billno) => api.get(`/customer/external-bills/${encodeURIComponent(String(billno).replace(/[\/\\]/g, '-'))}`),
  // Get a signed Railway-direct download URL (bypasses Vercel proxy for binary files)
  externalGetDownloadUrl: (billno, format) => api.get(`/customer/external-bills/${encodeURIComponent(String(billno).replace(/[\/\\]/g, '-'))}/download-url${format ? `?format=${format}` : ''}`),
  // Legacy: raw URL string (kept for backward compat, prefer externalGetDownloadUrl)
  externalDownloadUrl: (billno) => `${api.defaults.baseURL}/customer/external-bills/${billno}/download`,

  // ── Admin bill detail ──────────────────────────────────────────────────────
  adminGet:      (id) => api.get(`/admin/bills/${id}`),
  adminDownload: (id, format) => api.get(`/admin/bills/${id}/download${format ? `?format=${format}` : ''}`),
};

