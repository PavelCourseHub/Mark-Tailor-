import apiClient from './client';

export const productsAPI = {
  getCatalog: (params) => apiClient.get('/api/catalog/', { params }),
  getProduct: (slug) => apiClient.get(`/api/products/${slug}/`),
  getCategories: () => apiClient.get('/api/categories/'),
  getSearchSuggestions: (query) => apiClient.get('/api/search/suggestions/', { params: { q: query } }),
  getFilterOptions: () => apiClient.get('/api/filter-options/'),
  subscribe: (email) => apiClient.post('/api/subscribe/', { email }),
};
