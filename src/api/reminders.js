import api from './axios';

export const remindersApi = {
  list: () => api.get('/admin/reminder-rules'),
  create: (data) => api.post('/admin/reminder-rules', data),
  update: (id, data) => api.patch(`/admin/reminder-rules/${id}`, data),
  remove: (id) => api.delete(`/admin/reminder-rules/${id}`),
  toggle: (id, is_active) => api.patch(`/admin/reminder-rules/${id}`, { is_active }),
  
  // Customer endpoints
  customerPending: () => api.get('/customer/reminders/pending'),
  markRead: (id) => api.post(`/customer/reminders/${id}/read`),
};
