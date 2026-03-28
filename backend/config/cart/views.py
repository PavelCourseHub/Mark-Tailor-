from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
    CartResponseSerializer
)
from main.models import Product, ProductSize

logger = logging.getLogger(__name__)


class CartMixin:
    """
    Миксин для работы с корзиной
    """
    def get_cart(self, request):
        """
        Получить или создать корзину для текущей сессии/пользователя
        """
        # Если пользователь авторизован, используем его корзину
        if request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(
                user=request.user,
                defaults={'session_key': request.session.session_key}
            )
        else:
            # Для неавторизованных пользователей используем сессию
            if not request.session.session_key:
                request.session.create()
            
            cart, created = Cart.objects.get_or_create(
                session_key=request.session.session_key
            )
        
        # Сохраняем ID корзины в сессии для быстрого доступа
        request.session['cart_id'] = cart.id
        request.session.modified = True
        
        return cart


class CartView(APIView, CartMixin):
    """
    Получение информации о корзине
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart)
        
        return Response({
            'cart': serializer.data
        }, status=status.HTTP_200_OK)


class AddToCartView(APIView, CartMixin):
    """
    Добавление товара в корзину
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request, slug):
        cart = self.get_cart(request)
        product = get_object_or_404(Product, slug=slug, is_active=True)
        
        # Валидируем данные
        serializer = AddToCartSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid form data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        size_id = validated_data.get('size_id')
        quantity = validated_data['quantity']
        
        # Получаем размер товара
        if size_id:
            product_size = get_object_or_404(
                ProductSize,
                id=size_id,
                product=product
            )
        else:
            # Если размер не указан, берем первый доступный
            product_size = product.product_sizes.filter(stock__gt=0).first()
            if not product_size:
                return Response({
                    'error': 'No sizes available for this product'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверяем наличие на складе
        if product_size.stock < quantity:
            return Response({
                'error': f'Only {product_size.stock} items available'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверяем, есть ли уже такой товар в корзине
        existing_item = cart.items.filter(
            product=product,
            product_size=product_size
        ).first()
        
        if existing_item:
            total_quantity = existing_item.quantity + quantity
            if total_quantity > product_size.stock:
                return Response({
                    'error': f'Cannot add {quantity} items. Only {product_size.stock - existing_item.quantity} more available.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Добавляем товар в корзину
        cart_item = cart.add_product(product, product_size, quantity)
        
        # Обновляем сессию
        request.session['cart_id'] = cart.id
        request.session.modified = True
        
        # Получаем обновленную корзину
        cart_serializer = CartSerializer(cart)
        
        response_data = {
            'success': True,
            'message': f'{product.name} added to cart',
            'cart': cart_serializer.data,
            'cart_item_id': cart_item.id,
            'total_items': cart.total_items
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class UpdateCartItemView(APIView, CartMixin):
    """
    Обновление количества товара в корзине
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def put(self, request, item_id):
        cart = self.get_cart(request)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        
        # Валидируем данные
        serializer = UpdateCartItemSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        quantity = serializer.validated_data['quantity']
        
        # Если количество 0, удаляем товар
        if quantity == 0:
            cart_item.delete()
            message = f'{cart_item.product.name} removed from cart'
        else:
            # Проверяем наличие на складе
            if quantity > cart_item.product_size.stock:
                return Response({
                    'error': f'Only {cart_item.product_size.stock} items available'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            cart_item.quantity = quantity
            cart_item.save()
            message = f'{cart_item.product.name} quantity updated'
        
        # Обновляем сессию
        request.session['cart_id'] = cart.id
        request.session.modified = True
        
        # Получаем обновленную корзину
        cart_serializer = CartSerializer(cart)
        
        response_data = {
            'success': True,
            'message': message,
            'cart': cart_serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def patch(self, request, item_id):
        """
        Частичное обновление (для совместимости)
        """
        return self.put(request, item_id)


class RemoveCartItemView(APIView, CartMixin):
    """
    Удаление товара из корзины
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def delete(self, request, item_id):
        cart = self.get_cart(request)
        
        try:
            cart_item = cart.items.get(id=item_id)
            product_name = cart_item.product.name
            cart_item.delete()
            
            # Обновляем сессию
            request.session['cart_id'] = cart.id
            request.session.modified = True
            
            # Получаем обновленную корзину
            cart_serializer = CartSerializer(cart)
            
            response_data = {
                'success': True,
                'message': f'{product_name} removed from cart',
                'cart': cart_serializer.data
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Item not found in cart'
            }, status=status.HTTP_404_NOT_FOUND)


class CartCountView(APIView, CartMixin):
    """
    Получение количества товаров в корзине
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cart = self.get_cart(request)
        
        return Response({
            'total_items': cart.total_items,
            'subtotal': float(cart.subtotal),
            'total_price': float(cart.subtotal)
        }, status=status.HTTP_200_OK)


class ClearCartView(APIView, CartMixin):
    """
    Очистка корзины
    """
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        cart = self.get_cart(request)
        cart.clear()
        
        # Обновляем сессию
        request.session['cart_id'] = cart.id
        request.session.modified = True
        
        # Получаем пустую корзину
        cart_serializer = CartSerializer(cart)
        
        response_data = {
            'success': True,
            'message': 'Cart cleared successfully',
            'cart': cart_serializer.data
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class CartSummaryView(APIView, CartMixin):
    """
    Полная информация о корзине (для страницы корзины)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart)
        
        # Добавляем дополнительную информацию
        response_data = {
            'cart': serializer.data,
            'is_empty': cart.total_items == 0,
            'checkout_url': '/api/checkout/'  # URL для оформления заказа
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class CartItemDetailView(APIView, CartMixin):
    """
    Детальная информация о конкретном товаре в корзине
    """
    permission_classes = [AllowAny]

    def get(self, request, item_id):
        cart = self.get_cart(request)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        
        serializer = CartItemSerializer(cart_item)
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class MergeCartView(APIView):
    """
    Объединение корзины гостя с корзиной пользователя после авторизации
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        session_key = request.data.get('session_key')
        
        if not session_key:
            return Response({
                'error': 'Session key is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Получаем корзину гостя
            guest_cart = Cart.objects.get(session_key=session_key)
            
            # Получаем или создаем корзину пользователя
            user_cart, created = Cart.objects.get_or_create(
                user=request.user,
                defaults={'session_key': request.session.session_key}
            )
            
            # Переносим товары из корзины гостя в корзину пользователя
            for guest_item in guest_cart.items.all():
                existing_item = user_cart.items.filter(
                    product=guest_item.product,
                    product_size=guest_item.product_size
                ).first()
                
                if existing_item:
                    # Обновляем количество, если товар уже есть
                    existing_item.quantity += guest_item.quantity
                    existing_item.save()
                else:
                    # Переносим товар
                    guest_item.cart = user_cart
                    guest_item.save()
            
            # Удаляем корзину гостя
            guest_cart.delete()
            
            # Обновляем сессию
            request.session['cart_id'] = user_cart.id
            request.session.modified = True
            
            # Получаем обновленную корзину
            cart_serializer = CartSerializer(user_cart)
            
            return Response({
                'success': True,
                'message': 'Cart merged successfully',
                'cart': cart_serializer.data
            }, status=status.HTTP_200_OK)
            
        except Cart.DoesNotExist:
            return Response({
                'error': 'Guest cart not found'
            }, status=status.HTTP_404_NOT_FOUND)