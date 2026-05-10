import apiClient from './client';

export const productsAPI = {
  getCatalog: (params) => apiClient.get('api/catalog/', { params }),
  getProduct: (slug) => apiClient.get(`api/products/${slug}/`),
  getCategories: () => apiClient.get('api/categories/'),
  getSearchSuggestions: (query) => apiClient.get('api/search/suggestions/', { params: { q: query } }),
  getFilterOptions: () => apiClient.get('api/filter-options/'),
  subscribe: (email) => apiClient.post('api/subscribe/', { email }),

  // Отзывы
  getProductReviews: (slug) => apiClient.get(`api/products/${slug}/reviews/`),
  createReview: (slug, data) => apiClient.post(`api/products/${slug}/reviews/create/`, data),
  canReview: (slug) => apiClient.get(`api/products/${slug}/can-review/`),
  markReviewHelpful: (reviewId) => apiClient.post(`api/reviews/${reviewId}/helpful/`),
  
  // Промокоды
  validateCoupon: (code, cartTotal) => apiClient.post('api/coupons/validate/', { code, cart_total: cartTotal }),
  getAvailableCoupons: () => apiClient.get('api/coupons/available/'),
};