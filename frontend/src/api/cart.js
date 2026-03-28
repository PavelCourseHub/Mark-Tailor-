export const cartAPI = {
  getCart: () => apiClient.get('/cart/'),
  addToCart: (slug, data) => apiClient.post(`/cart/add/${slug}/`, data),
  updateItem: (itemId, data) => apiClient.put(`/cart/item/${itemId}/update/`, data),
  removeItem: (itemId) => apiClient.delete(`/cart/item/${itemId}/remove/`),
  clearCart: () => apiClient.post('/cart/clear/'),
  getCartCount: () => apiClient.get('/cart/count/'),
};