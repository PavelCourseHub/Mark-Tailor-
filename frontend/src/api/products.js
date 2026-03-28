export const productsAPI = {
  getCatalog: (params) => apiClient.get('/catalog/', { params }),
  getProduct: (slug) => apiClient.get(`/products/${slug}/`),
  getCategories: () => apiClient.get('/categories/'),
  getSearchSuggestions: (query) => apiClient.get('/search/suggestions/', { params: { q: query } }),
};