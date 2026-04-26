import apiClient from './client';

export const authAPI = {
  register: (userData) => apiClient.post('/users/register/', userData),
  login: (credentials) => apiClient.post('/users/login/', credentials),
  logout: () => apiClient.post('/users/logout/'),
  getProfile: () => apiClient.get('/users/profile/'),
  updateProfile: (data) => apiClient.put('/users/profile/', data),
  patchProfile: (data) => apiClient.patch('/users/profile/', data),
  getAccountDetails: () => apiClient.get('/users/account/details/'),
  updateAccountDetails: (data) => apiClient.put('/users/account/update/', data),
  changePassword: (data) => apiClient.post('/users/change-password/', data),
  forgotPassword: (email) => apiClient.post('/users/forgot-password/', { email }),
  
  resetPassword: (uidb64, token, new_password1, new_password2) => 
  apiClient.post('/users/reset-password/', {
    uidb64: uidb64,
    token: token,
    new_password1: new_password1,
    new_password2: new_password2,
  }),
};