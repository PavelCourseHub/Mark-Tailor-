import apiClient from './client';

export const ordersAPI = {
  createOrder: (data) => apiClient.post('orders/api/checkout/', data),
  getOrders: (page = 1, pageSize = 10) => 
    apiClient.get(`orders/api/orders/?page=${page}&page_size=${pageSize}`),
  getOrderDetail: (orderId) => apiClient.get(`orders/api/orders/${orderId}/`),
  cancelOrder: (orderId) => apiClient.post(`orders/api/orders/${orderId}/cancel/`),
};