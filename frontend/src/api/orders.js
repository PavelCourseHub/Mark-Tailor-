export const ordersAPI = {
  createOrder: (data) => apiClient.post('/checkout/', data),
  getOrders: () => apiClient.get('/orders/'),
  getOrderDetail: (orderId) => apiClient.get(`/orders/${orderId}/`),
  cancelOrder: (orderId) => apiClient.post(`/orders/${orderId}/cancel/`),
};