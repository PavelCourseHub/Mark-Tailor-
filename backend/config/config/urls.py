from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    #path('password-reset/confirm/<uidb64>/<token>/', 
    #     auth_views.PasswordResetConfirmView.as_view(), 
    #     name='password_reset_confirm'),
    path('', include('main.urls', namespace='main')), 
    path('users/', include('users.urls', namespace='users')),
    path('cart/', include('cart.urls', namespace='cart')),
    path('orders/', include('orders.urls', namespace='orders')),
    path('payment/', include('payment.urls', namespace='payment')),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/', include('dj_rest_auth.urls')),
    path('password-reset/confirm/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(), 
         name='password_reset_confirm'),

    #path('password-reset/', 
    #     auth_views.PasswordResetView.as_view(
    #         html_email_template_name='registration/password_reset_email.html'
    #     ), 
    #     name='password_reset'),
    #path('password-reset/confirm/<uidb64>/<token>/', 
    #     auth_views.PasswordResetConfirmView.as_view(
    #         success_url='/login/'
    #     ), 
    #     name='password_reset_confirm'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)