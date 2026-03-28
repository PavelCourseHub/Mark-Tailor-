from django.urls import path
from .views import (
    CreateStripeCheckoutSessionView,
    StripeWebhookView,
    StripeSuccessView,
    StripeCancelView,
    PaymentStatusView
)

app_name = 'payment'

urlpatterns = [
    path('api/payment/stripe/create-session/', 
         CreateStripeCheckoutSessionView.as_view(), 
         name='api_stripe_create_session'),
    
    path('api/payment/stripe/webhook/', 
         StripeWebhookView.as_view(), 
         name='api_stripe_webhook'),
    
    path('api/payment/stripe/success/', 
         StripeSuccessView.as_view(), 
         name='api_stripe_success'),
    
    path('api/payment/stripe/cancel/', 
         StripeCancelView.as_view(), 
         name='api_stripe_cancel'),
    
    path('api/payment/status/<int:order_id>/', 
         PaymentStatusView.as_view(), 
         name='api_payment_status'),
]