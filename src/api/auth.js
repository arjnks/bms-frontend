import api from './axios';

export const authApi = {
  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },

  register: async (data) => {
    return api.post('/auth/register', data);
  },

  logout: async () => {
    return api.post('/auth/logout');
  },

  me: async () => {
    return api.get('/auth/me');
  },

  getLogs: async () => {
    return api.get('/admin/login-logs');
  },
};
