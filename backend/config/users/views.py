from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from django.db import transaction

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserUpdateSerializer,
    UserSerializer,
    ProductSerializer,
    OrderSerializer
)
from .models import CustomUser
from main.models import Product
from orders.models import Order


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                
                return Response({
                    'message': 'User created successfully',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        recommended_products = Product.objects.all().order_by('id')[:3]
        
        return Response({
            'user': UserSerializer(user).data,
            'recommended_products': ProductSerializer(recommended_products, many=True).data
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

    def patch(self, request):
        serializer = UserUpdateSerializer(instance=request.user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AccountDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(UserSerializer(user).data)


class EditAccountDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(UserUpdateSerializer(user).data)


class UpdateAccountDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        serializer = UserUpdateSerializer(instance=request.user, data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()
                # Обновляем request.user
                request.user.refresh_from_db()
                
                return Response({
                    'message': 'Account details updated successfully',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        serializer = UserUpdateSerializer(instance=request.user, data=request.data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()
                request.user.refresh_from_db()
                
                return Response({
                    'message': 'Account details updated successfully',
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


class OrderHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)