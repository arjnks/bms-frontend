import api from './axios';

export const customersApi = {
  list: (params) => api.get('/admin/customers', { params }),
  get: (id) => api.get(`/admin/customers/${id}`),
  update: (id, data) => api.patch(`/admin/customers/${id}`, data),
  delete: (id) => api.delete(`/admin/customers/${id}`),
  remind: (id) => api.post(`/admin/customers/${id}/remind`),
  bulkRemind: (ids) => api.post('/admin/remind/bulk', { customer_ids: ids }),
  externalBills: (id, params) => api.get(`/admin/customers/${id}/external-bills`, { params }),
  externalBillDetails: (id, billno) => api.get(`/admin/customers/${id}/external-bills/${billno}`),
  downloadExternalBillUrl: (id, billno) => `${api.defaults.baseURL}/admin/customers/${id}/external-bills/${billno}/download`,
  syncStatus: () => api.get('/admin/sync/status'),
  syncFromBilling: () => api.post('/admin/sync/customers'),
};
