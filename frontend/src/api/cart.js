import apiClient from './client';

export const cartAPI = {
  getCart: () => apiClient.get('cart/api/cart/'),
  getCartSummary: () => apiClient.get('cart/api/cart/summary/'),
  getCartCount: () => apiClient.get('cart/api/cart/count/'),
  getSessionKey: () => apiClient.get('cart/api/session-key/'),
  addToCart: (slug, data) => apiClient.post(`cart/api/cart/add/${slug}/`, data),
  updateCartItem: (itemId, data) => apiClient.put(`cart/api/cart/item/${itemId}/update/`, data),
  removeCartItem: (itemId) => apiClient.delete(`cart/api/cart/item/${itemId}/remove/`),
  clearCart: () => apiClient.post('cart/api/cart/clear/'),
  mergeCart: (sessionKey) => {
  console.log('🔀 Calling mergeCart with URL: /cart/api/cart/merge/');
  console.log('🔀 Session key:', sessionKey);
  return apiClient.post('/cart/api/cart/merge/', { session_key: sessionKey });
},
};