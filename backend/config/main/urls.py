from django.urls import path
from .views import (
    IndexView,
    CatalogView,
    ProductDetailView,
    CategoryListView,
    SearchSuggestionsView,
    FilterOptionsView,
    SubscribeView,
    ProductReviewListView,
    ReviewCreateView,
    ReviewHelpfulView,
    CanReviewView,
    ValidateCouponView,
    AvailableCouponsView
)

app_name = 'main'  

urlpatterns = [
    path('api/', IndexView.as_view(), name='api_index'),
    path('api/catalog/', CatalogView.as_view(), name='api_catalog'),
    path('api/products/<slug:slug>/', ProductDetailView.as_view(), name='api_product_detail'),
    path('api/categories/', CategoryListView.as_view(), name='api_categories'),
    path('api/search/suggestions/', SearchSuggestionsView.as_view(), name='api_search_suggestions'),
    path('api/filter-options/', FilterOptionsView.as_view(), name='api_filter_options'),
    path('api/subscribe/', SubscribeView.as_view(), name='subscribe'),
    
    # Отзывы
    path('api/products/<slug:slug>/reviews/', ProductReviewListView.as_view(), name='product_reviews'),
    path('api/products/<slug:slug>/reviews/create/', ReviewCreateView.as_view(), name='review_create'),
    path('api/products/<slug:slug>/can-review/', CanReviewView.as_view(), name='can_review'),
    path('api/reviews/<int:review_id>/helpful/', ReviewHelpfulView.as_view(), name='review_helpful'),
    
    # Промокоды
    path('api/coupons/validate/', ValidateCouponView.as_view(), name='validate_coupon'),
    path('api/coupons/available/', AvailableCouponsView.as_view(), name='available_coupons'),
]