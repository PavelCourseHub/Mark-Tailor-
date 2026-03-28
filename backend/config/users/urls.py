from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    AccountDetailsView,
    EditAccountDetailsView,
    UpdateAccountDetailsView,
    LogoutView,
    OrderHistoryView,
    OrderDetailView
)

app_name = 'users'

urlpatterns = [
    path('api/register/', RegisterView.as_view(), name='api_register'),
    path('api/login/', LoginView.as_view(), name='api_login'),
    path('api/logout/', LogoutView.as_view(), name='api_logout'),
    path('api/profile/', ProfileView.as_view(), name='api_profile'),
    path('api/account/details/', AccountDetailsView.as_view(), name='api_account_details'),
    path('api/account/edit/', EditAccountDetailsView.as_view(), name='api_edit_account'),
    path('api/account/update/', UpdateAccountDetailsView.as_view(), name='api_update_account'),
    path('api/orders/', OrderHistoryView.as_view(), name='api_order_history'),
    path('api/orders/<int:order_id>/', OrderDetailView.as_view(), name='api_order_detail'),
]