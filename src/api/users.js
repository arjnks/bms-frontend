import api from './axios';

export const usersApi = {
  pending: ()                    => api.get('/admin/users/pending'),
  approve: (id, data = {})       => api.post(`/admin/users/${id}/approve`, data),
  reject:  (id, reason = null)   => api.post(`/admin/users/${id}/reject`, { reason }),
};
