from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
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
        # Убеждаемся, что сессия существует
        if not request.session.session_key:
            request.session.create()
            print(f"🆕 Created new session: {request.session.session_key}")
        
        print(f"📍 Session key: {request.session.session_key}")
        
        # Для авторизованных пользователей
        if request.user.is_authenticated:
            # Пытаемся найти корзину пользователя
            cart = Cart.objects.filter(user=request.user).first()
            
            if cart:
                # Обновляем session_key, если изменился
                if cart.session_key != request.session.session_key:
                    cart.session_key = request.session.session_key
                    cart.save()
                print(f"👤 User cart: id={cart.id}, items={cart.items.count()}")
            else:
                # Пытаемся найти корзину по session_key для переноса
                guest_cart = Cart.objects.filter(session_key=request.session.session_key).first()
                
                if guest_cart:
                    print(f"📦 Moving guest cart to user: {guest_cart.id}")
                    guest_cart.user = request.user
                    guest_cart.save()
                    cart = guest_cart
                else:
                    cart = Cart.objects.create(
                        user=request.user,
                        session_key=request.session.session_key
                    )
                    print(f"🆕 Created new user cart: id={cart.id}")
        else:
            # Для гостей - ищем по session_key
            cart, created = Cart.objects.get_or_create(
                session_key=request.session.session_key
            )
            print(f"👤 Guest cart: id={cart.id}, created={created}, items={cart.items.count()}")
        
        # Сохраняем ID корзины в сессии
        request.session['cart_id'] = cart.id
        request.session.modified = True
        
        return cart


class CartView(APIView, CartMixin):
    """
    Получение информации о корзине
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            cart = self.get_cart(request)
            serializer = CartSerializer(cart)
            
            return Response({
                'cart': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"❌ CartView error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AddToCartView(APIView, CartMixin):
    """
    Добавление товара в корзину
    """
    permission_classes = [AllowAny]

    @csrf_exempt
    @transaction.atomic
    def post(self, request, slug):
        print("=" * 50)
        print(f"📦 ADD TO CART")
        print(f"Session key before: {request.session.session_key}")
        print(f"User: {request.user}")

        if not request.session.session_key:
            request.session.create()
            request.session.save()
            print(f"🆕 Created new session: {request.session.session_key}")

    
        cart = self.get_cart(request)
        print(f"Cart ID: {cart.id}, items before: {cart.items.count()}")
        product = get_object_or_404(Product, slug=slug, is_active=True)

        # Активируем сессию
        if not request.session.session_key:
            request.session.create()
        
        print(f"AddToCartView: user={request.user}, session_key={request.session.session_key}")
        
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
        
         # Получаем существующий товар в корзине
        existing_item = cart.items.filter(
            product=product,
            product_size=product_size
        ).first()
        
        # Рассчитываем новое количество
        if existing_item:
            total_quantity = existing_item.quantity + quantity
        else:
            total_quantity = quantity

        # Проверяем наличие на складе
        if total_quantity > product_size.stock:
            available = product_size.stock - (existing_item.quantity if existing_item else 0)
            return Response({
                'error': f'Cannot add {quantity} items. Only {available} more available.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Добавляем товар в корзину
        try:
            cart_item = cart.add_product(product, product_size, quantity)
            print(f"Added item: cart_item_id={cart_item.id}, quantity={cart_item.quantity}")
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
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
        
        print(f"Cart items after: {cart.items.count()}")
        print("=" * 50)
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

@method_decorator(csrf_exempt, name='dispatch')
class MergeCartView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        session_key = request.data.get('session_key')
        
        print(f"🔄 MergeCartView called with session_key: {session_key}")
        
        if not session_key:
            return Response({
                'error': 'Session key is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 👇 ИЩЕМ КОРЗИНУ ПО session_key (НЕ ПОЛЬЗОВАТЕЛЯ)
            guest_cart = Cart.objects.filter(session_key=session_key).first()
            
            if not guest_cart:
                print(f"❌ Guest cart not found for session_key: {session_key}")
                return Response({
                    'error': 'Guest cart not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            print(f"📦 Guest cart found: id={guest_cart.id}, items={guest_cart.items.count()}")
            
            # Получаем или создаём корзину пользователя
            user_cart, created = Cart.objects.get_or_create(
                user=request.user,
                defaults={'session_key': request.session.session_key}
            )
            print(f"👤 User cart: id={user_cart.id}, created={created}, items={user_cart.items.count()}")
            
            # Переносим товары
            for guest_item in guest_cart.items.all():
                print(f"📦 Moving item: product={guest_item.product.name}, quantity={guest_item.quantity}")
                
                existing_item = user_cart.items.filter(
                    product=guest_item.product,
                    product_size=guest_item.product_size
                ).first()
                
                if existing_item:
                    existing_item.quantity += guest_item.quantity
                    existing_item.save()
                    print(f"  ↪ Updated existing item, new quantity={existing_item.quantity}")
                else:
                    guest_item.cart = user_cart
                    guest_item.save()
                    print(f"  ↪ Moved to user cart")
            
            # Удаляем корзину гостя
            guest_cart.delete()
            print(f"🗑️ Guest cart deleted")
            
            return Response({
                'success': True,
                'message': 'Cart merged successfully',
                'cart': CartSerializer(user_cart).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class SessionKeyView(APIView, CartMixin):
    permission_classes = [AllowAny]

    def get(self, request):
        # Убеждаемся, что сессия существует
        if not request.session.session_key:
            request.session.create()
            print(f"🆕 SessionKeyView: created new session: {request.session.session_key}")
        
        # Получаем ИЛИ СОЗДАЁМ корзину для этой сессии
        cart, created = Cart.objects.get_or_create(
            session_key=request.session.session_key
        )
        
        if created:
            print(f"🆕 Created new cart for session: {cart.session_key}")
        
        # Обновляем session_key в корзине, если нужно
        if cart.session_key != request.session.session_key:
            cart.session_key = request.session.session_key
            cart.save()
            print(f"🔄 Updated cart session_key to: {cart.session_key}")
        
        print(f"🔑 SessionKeyView: session_key={request.session.session_key}, cart_id={cart.id}")
        
        return Response({
            'session_key': cart.session_key
        }, status=status.HTTP_200_OK)