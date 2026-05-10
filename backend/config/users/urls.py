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
    OrderDetailView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
)

app_name = 'users'  

urlpatterns = [
    path('register/', RegisterView.as_view(), name='api_register'),
    path('login/', LoginView.as_view(), name='api_login'),
    path('logout/', LogoutView.as_view(), name='api_logout'),
    path('profile/', ProfileView.as_view(), name='api_profile'),
    path('account/details/', AccountDetailsView.as_view(), name='api_account_details'),
    path('account/edit/', EditAccountDetailsView.as_view(), name='api_edit_account'),
    path('account/update/', UpdateAccountDetailsView.as_view(), name='api_update_account'),
    path('orders/', OrderHistoryView.as_view(), name='api_order_history'),
    path('orders/<int:order_id>/', OrderDetailView.as_view(), name='api_order_detail'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]