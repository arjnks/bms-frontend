import api from './axios';

export const reportsApi = {
  overview: () => api.get('/admin/overview'),
  aging: () => api.get('/admin/reports/aging'),
  collections: (params) => api.get('/admin/reports/collections', { params }),
};
