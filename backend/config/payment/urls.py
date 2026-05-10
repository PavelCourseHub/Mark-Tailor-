from django.urls import path
from .views import (
    CreateStripeCheckoutSessionView,
    CreatePaymentIntentView,
    StripeWebhookView,
    StripeSuccessView,
    StripeCancelView,
    PaymentStatusView,
    StripeConfigView
)

app_name = 'payment'

urlpatterns = [
    path('stripe/create-session/', CreateStripeCheckoutSessionView.as_view(), name='stripe_create_session'),
    path('stripe/create-payment-intent/', CreatePaymentIntentView.as_view(), name='stripe_create_payment_intent'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
    path('stripe/success/', StripeSuccessView.as_view(), name='stripe_success'),
    path('stripe/cancel/', StripeCancelView.as_view(), name='stripe_cancel'),
    path('status/<int:order_id>/', PaymentStatusView.as_view(), name='payment_status'),
    path('stripe/config/', StripeConfigView.as_view(), name='stripe_config'),
]