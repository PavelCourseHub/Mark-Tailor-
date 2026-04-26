import apiClient from './client';

export const paymentAPI = {
  createCheckoutSession: (orderId, successUrl, cancelUrl) => 
    apiClient.post('/payment/stripe/create-session/', {
      order_id: orderId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  
  getPaymentStatus: (orderId) => 
    apiClient.get(`/payment/status/${orderId}/`),
  
  getStripeConfig: () => 
    apiClient.get('/payment/stripe/config/'),
  
  handleSuccess: (sessionId) => 
    apiClient.get(`/payment/stripe/success/?session_id=${sessionId}`),
  
  handleCancel: (orderId) => 
    apiClient.get(`/payment/stripe/cancel/?order_id=${orderId}`),
};