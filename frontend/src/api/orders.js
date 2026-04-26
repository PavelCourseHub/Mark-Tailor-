import apiClient from './client';

export const ordersAPI = {
  createOrder: (data) => apiClient.post('/orders/api/checkout/', data),  // Проверьте этот путь
  getOrders: () => apiClient.get('/orders/api/orders/'),
  getOrderDetail: (orderId) => apiClient.get(`/orders/api/orders/${orderId}/`),
  cancelOrder: (orderId) => apiClient.post(`/orders/api/orders/${orderId}/cancel/`),
};