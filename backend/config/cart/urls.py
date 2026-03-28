from django.urls import path
from .views import (
    CartView,
    AddToCartView,
    UpdateCartItemView,
    RemoveCartItemView,
    CartCountView,
    ClearCartView,
    CartSummaryView,
    CartItemDetailView,
    MergeCartView
)

app_name = 'cart'

urlpatterns = [
    path('api/cart/', CartView.as_view(), name='api_cart'),
    path('api/cart/summary/', CartSummaryView.as_view(), name='api_cart_summary'),
    path('api/cart/count/', CartCountView.as_view(), name='api_cart_count'),
    path('api/cart/clear/', ClearCartView.as_view(), name='api_cart_clear'),
    path('api/cart/merge/', MergeCartView.as_view(), name='api_cart_merge'),
    path('api/cart/add/<slug:slug>/', AddToCartView.as_view(), name='api_add_to_cart'),
    path('api/cart/item/<int:item_id>/', CartItemDetailView.as_view(), name='api_cart_item'),
    path('api/cart/item/<int:item_id>/update/', UpdateCartItemView.as_view(), name='api_update_cart_item'),
    path('api/cart/item/<int:item_id>/remove/', RemoveCartItemView.as_view(), name='api_remove_cart_item'),
]