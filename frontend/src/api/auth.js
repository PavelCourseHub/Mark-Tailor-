import apiClient from './client';

export const authAPI = {
  register: (data) => apiClient.post('/users/register/', data),
  login: (data) => apiClient.post('/users/login/', data),
  logout: () => apiClient.post('/users/logout/'),
  getProfile: () => apiClient.get('/users/profile/'),
  updateProfile: (data) => apiClient.put('/users/profile/', data),
};