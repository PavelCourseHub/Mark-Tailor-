from django.urls import path
from .views import (
    IndexView,
    CatalogView,
    ProductDetailView,
    CategoryListView,
    SearchSuggestionsView,
    FilterOptionsView
)

app_name = 'main'

urlpatterns = [
    path('api/', IndexView.as_view(), name='api_index'),
    path('api/catalog/', CatalogView.as_view(), name='api_catalog'),
    path('api/products/<slug:slug>/', ProductDetailView.as_view(), name='api_product_detail'),
    path('api/categories/', CategoryListView.as_view(), name='api_categories'),
    path('api/search/suggestions/', SearchSuggestionsView.as_view(), name='api_search_suggestions'),
    path('api/filter-options/', FilterOptionsView.as_view(), name='api_filter_options'),
]