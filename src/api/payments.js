import api from './axios';

export const paymentsApi = {
  // Bills with payment_submitted status are fetched via billsApi.list({ payment_status: 'payment_submitted' })
  // These endpoints handle the verify/reject actions:
  verify: (id)           => api.post(`/admin/bills/${id}/verify-payment`),
  reject: (id, reason)   => api.post(`/admin/bills/${id}/reject-payment`, { reason }),
};
