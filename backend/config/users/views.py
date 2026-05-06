from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode  # 👈 ДОБАВЬТЕ
from django.utils.encoding import force_str, force_bytes

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserUpdateSerializer,
    UserSerializer
)
from .models import CustomUser
from orders.models import Order
from orders.serializers import OrderSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User created successfully',
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        print("=" * 50)
        print("Login request received")
        print("Request data:", request.data)
        print("=" * 50)

        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'user': UserSerializer(request.user).data
        })
    
    def put(self, request):
        serializer = UserUpdateSerializer(instance=request.user, data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({
                'error': 'Password must be at least 6 characters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class AccountDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class EditAccountDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserUpdateSerializer(request.user).data)


class UpdateAccountDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        serializer = UserUpdateSerializer(instance=request.user, data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Account details updated successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response({'orders': serializer.data})


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)


#class ForgotPasswordView(APIView):
#    permission_classes = [AllowAny]
    
#    def post(self, request):
#        email = request.data.get('email')
#        if not email:
#            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
#        try:
#            user = CustomUser.objects.get(email=email)
#            # Здесь будет отправка email
#            # Пока возвращаем заглушку
#            return Response({
#                'message': f'Password reset link sent to {email}'
#            }, status=status.HTTP_200_OK)
#        except CustomUser.DoesNotExist:
#            return Response({
#                'message': 'If an account with this email exists, a reset link has been sent'
#            }, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = CustomUser.objects.get(email=email)
            
            # Генерируем uid и token
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # Создаём ссылку на React фронтенд
            reset_link = f'http://localhost:3000/password-reset/confirm/{uid}/{token}/'
            
            # Отправляем письмо
            from django.core.mail import send_mail
            
            subject = 'Сброс пароля на Mark Tailor'
            message = f'''Здравствуйте!

Вы получили это письмо, потому что запросили сброс пароля для вашей учетной записи.

Для сброса пароля перейдите по ссылке:
{reset_link}

Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.

С уважением,
Команда Mark Tailor'''
            
            send_mail(
                subject,
                message,
                'info@marktailor.com',
                [email],
                fail_silently=False,
            )
            
            print(f"Reset link sent to {email}: {reset_link}")
            
            return Response({
                'message': 'Password reset link sent to your email'
            }, status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({
                'message': 'If an account with this email exists, a reset link has been sent'
            }, status=status.HTTP_200_OK)

#class ResetPasswordView(APIView):
#    """
#    Сброс пароля по токену (после перехода по ссылке из письма)
#    """
#    permission_classes = [AllowAny]
#    
#    def post(self, request):
#        print("=" * 50)
#        print("RESET PASSWORD REQUEST RECEIVED")
#        print("Request data:", request.data)
#        print("=" * 50)
#        
#        # Получаем данные из запроса
#        uidb64 = request.data.get('uidb64')
#        token = request.data.get('token')
#        new_password1 = request.data.get('new_password1')
#        new_password2 = request.data.get('new_password2')
#        
#        print(f"uidb64: {uidb64}")
#        print(f"token: {token}")
#        print(f"new_password1: {new_password1}")
#        print(f"new_password2: {new_password2}")
        
#        # Проверка обязательных полей
#        if not uidb64 or not token or not new_password1:
#            print("ERROR: Missing required fields")
#            return Response(
#                {'error': 'uidb64, token and new_password1 are required'}, 
#                status=status.HTTP_400_BAD_REQUEST
#            )
#        
#        # Проверка совпадения паролей
#        if new_password1 != new_password2:
#            print("ERROR: Passwords do not match")
#            return Response(
#                {'error': 'Passwords do not match'}, 
#                status=status.HTTP_400_BAD_REQUEST
#            )
#        
#        # Проверка длины пароля
#        if len(new_password1) < 6:
#            print("ERROR: Password too short")
#            return Response(
#                {'error': 'Password must be at least 6 characters'}, 
#                status=status.HTTP_400_BAD_REQUEST
#            )
        
        # Декодируем uidb64 и находим пользователя
#        try:
#            uid = force_str(urlsafe_base64_decode(uidb64))
#            print(f"Decoded uid: {uid}")
#            user = CustomUser.objects.get(pk=uid)
#            print(f"User found: {user.email}")
#        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist) as e:
#            print(f"ERROR: Invalid uid - {str(e)}")
#            return Response(
#                {'error': 'Invalid reset link'}, 
#                status=status.HTTP_400_BAD_REQUEST
#            )
        
        # Проверяем токен
#        if not default_token_generator.check_token(user, token):
#            print("ERROR: Invalid or expired token")
#            return Response(
#                {'error': 'Invalid or expired reset link'}, 
#                status=status.HTTP_400_BAD_REQUEST
#            )
        
#        print("All validations passed. Resetting password...")
        
        # Устанавливаем новый пароль
#        user.set_password(new_password1)
#        user.save()
        
#        print(f"Password reset successfully for user: {user.email}")
        
#        return Response(
#            {'message': 'Password reset successfully. You can now log in with your new password.'}, 
#            status=status.HTTP_200_OK
#        )

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password1 = request.data.get('new_password1')
        new_password2 = request.data.get('new_password2')
        
        if not uidb64 or not token or not new_password1:
            return Response(
                {'error': 'Missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password1 != new_password2:
            return Response(
                {'error': 'Passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password1) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Invalid or expired reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password1)
        user.save()
        
        return Response(
            {'message': 'Password reset successfully'}, 
            status=status.HTTP_200_OK
        )