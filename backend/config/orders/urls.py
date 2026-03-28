from django.urls import path
from .views import (
    CheckoutView,
    OrderListView,
    OrderDetailView,
    OrderCancelView
)

app_name = 'orders'

urlpatterns = [
    path('api/checkout/', CheckoutView.as_view(), name='api_checkout'),
    path('api/orders/', OrderListView.as_view(), name='api_orders'),
    path('api/orders/<int:order_id>/', OrderDetailView.as_view(), name='api_order_detail'),
    path('api/orders/<int:order_id>/cancel/', OrderCancelView.as_view(), name='api_order_cancel'),
]