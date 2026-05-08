from cart.models import CartItem
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import logging
import stripe
from django.conf import settings
from django.utils import timezone

from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    CheckoutRequestSerializer,
    CartSerializer,
    CheckoutResponseSerializer
)
from cart.views import CartMixin
from decimal import Decimal

logger = logging.getLogger(__name__)

# Настройка Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получить информацию для оформления заказа"""
        cart_mixin = CartMixin()
        cart = cart_mixin.get_cart(request)
        
        if cart.total_items == 0:
            return Response({
                'error': 'Cart is empty',
                'message': 'Your cart is empty'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_items = cart.items.select_related('product', 'product_size__size').order_by('-added_at')
        
        cart_data = {
            'id': cart.id,
            'total_items': cart.total_items,
            'subtotal': float(cart.subtotal),
            'items': []
        }
        
        for item in cart_items:
            cart_data['items'].append({
                'id': item.id,
                'product_id': item.product.id,
                'product_name': item.product.name,
                'product_slug': item.product.slug,
                'product_price': float(item.product.price),
                'size_id': item.product_size.id,
                'size_name': item.product_size.size.name,
                'quantity': item.quantity,
                'subtotal': float(item.product.price * item.quantity),
                'stock_available': item.product_size.stock,
                'product_image': item.product.main_image.url if item.product.main_image else None
            })
        
        user_data = {
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'phone': getattr(request.user, 'phone', ''),
            'address1': getattr(request.user, 'address1', ''),
            'address2': getattr(request.user, 'address2', ''),
            'city': getattr(request.user, 'city', ''),
            'country': getattr(request.user, 'country', ''),
            'province': getattr(request.user, 'province', ''),
            'postal_code': getattr(request.user, 'postal_code', ''),
        }
        
        return Response({
            'cart': cart_data,
            'user_data': user_data,
            'available_payment_providers': ['stripe', 'heleket']
        }, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def post(self, request):
        """Создать заказ ТОЛЬКО из выбранных товаров с учётом промокода"""
        cart_mixin = CartMixin()
        cart = cart_mixin.get_cart(request)
        
        # Получаем ID выбранных товаров
        selected_item_ids = request.data.get('selected_items', [])
        
        if not selected_item_ids:
            return Response({
                'error': 'No items selected',
                'message': 'Пожалуйста, выберите хотя бы один товар для оформления заказа'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Фильтруем выбранные товары
        selected_items = cart.items.filter(id__in=selected_item_ids)
        
        if not selected_items.exists():
            return Response({
                'error': 'Selected items not found in cart'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Рассчитываем сумму только для выбранных товаров
        total_price = sum(item.total_price for item in selected_items)
        
        # Проверяем и применяем промокод
        coupon_code = request.data.get('coupon_code')
        coupon = None
        discount_amount = Decimal('0')
        
        if coupon_code:
            from main.models import Coupon
            try:
                coupon = Coupon.objects.get(
                    code=coupon_code.upper(),
                    is_active=True,
                    valid_from__lte=timezone.now(),
                    valid_to__gte=timezone.now()
                )
                
                # Проверка лимита использований
                if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
                    return Response({
                        'error': 'Coupon usage limit exceeded',
                        'message': 'Промокод больше недоступен'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Проверка минимальной суммы заказа
                if total_price < coupon.min_order_amount:
                    return Response({
                        'error': f'Minimum order amount for this coupon is {coupon.min_order_amount} BYN',
                        'message': f'Минимальная сумма заказа для этого промокода: {coupon.min_order_amount} BYN'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Расчёт скидки
                if coupon.discount_type == 'percent':
                    discount_amount = total_price * coupon.discount_value / 100
                    if coupon.max_discount_amount:
                        discount_amount = min(discount_amount, coupon.max_discount_amount)
                else:
                    discount_amount = min(coupon.discount_value, total_price)
                
                total_price -= discount_amount
                
            except Coupon.DoesNotExist:
                return Response({
                    'error': 'Invalid coupon code',
                    'message': 'Неверный промокод'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CheckoutRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Validation error',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        delivery_method = validated_data.get('delivery_method', 'pickup')
        
        try:
            # Создаём заказ из выбранных товаров
            order = Order.objects.create(
                user=request.user,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                email=validated_data.get('email') or request.user.email,
                company=validated_data.get('company', ''),
                address1=validated_data.get('address1', '') if delivery_method == 'courier' else '',
                address2=validated_data.get('address2', '') if delivery_method == 'courier' else '',
                city=validated_data.get('city', '') if delivery_method == 'courier' else '',
                country=validated_data.get('country', '') if delivery_method == 'courier' else '',
                province=validated_data.get('province', '') if delivery_method == 'courier' else '',
                postal_code=validated_data.get('postal_code', '') if delivery_method == 'courier' else '',
                phone=validated_data.get('phone', ''),
                special_instructions=validated_data.get('special_instructions', ''),
                total_price=total_price,
                payment_provider=validated_data['payment_provider'],
            )
            
            # Привязываем промокод к заказу
            if coupon:
                order.coupon = coupon
                order.discount_amount = discount_amount
                order.save()
                coupon.used_count += 1
                coupon.save()
            
            logger.info(f"Order created from selected items: order_id={order.id}, items_count={selected_items.count()}, discount={discount_amount}")
            
            # Создаём элементы заказа из выбранных товаров
            for item in selected_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    size=item.product_size,
                    quantity=item.quantity,
                    price=item.product.sale_price if item.product.is_on_sale else item.product.price
                )
            
            payment_provider = validated_data['payment_provider']
            checkout_url = None
            
            if payment_provider == 'stripe':
                try:
                    line_items = []
                    for item in selected_items:
                        product_name = f"{item.product.name}"
                        if item.product_size and item.product_size.size:
                            product_name += f" - {item.product_size.size.name}"
                        
                        price = item.product.sale_price if item.product.is_on_sale else item.product.price
                        
                        # Применяем пропорциональную скидку к каждому товару
                        if discount_amount > 0 and total_price > 0:
                            item_discount = (price * item.quantity / (total_price + discount_amount)) * discount_amount
                            discounted_price = price * item.quantity - item_discount
                            price_per_unit = discounted_price / item.quantity
                        else:
                            price_per_unit = price
                        
                        price_in_eur = int(price_per_unit * Decimal(100) / Decimal(3.5))
                        
                        line_items.append({
                            'price_data': {
                                'currency': 'eur',
                                'product_data': {
                                    'name': f"{product_name} ({price:.2f} BYN)",
                                },
                                'unit_amount': price_in_eur,
                            },
                            'quantity': item.quantity,
                        })
                    
                    if delivery_method == 'courier':
                        shipping_cost_byn = 10
                        shipping_cost_cents = int(shipping_cost_byn * 100 / 3.5)
                        line_items.append({
                            'price_data': {
                                'currency': 'eur',
                                'product_data': {
                                    'name': f"Доставка курьером ({shipping_cost_byn:.2f} BYN)",
                                },
                                'unit_amount': shipping_cost_cents,
                            },
                            'quantity': 1,
                        })
                    
                    success_url = request.build_absolute_uri('/payment/stripe/success/')
                    cancel_url = request.build_absolute_uri('/payment/stripe/cancel/')
                    
                    checkout_session = stripe.checkout.Session.create(
                        payment_method_types=['card'],
                        line_items=line_items,
                        mode='payment',
                        success_url=success_url + '?session_id={CHECKOUT_SESSION_ID}&order_id=' + str(order.id),
                        cancel_url=cancel_url + f'?order_id={order.id}',
                        metadata={'order_id': order.id}
                    )
                    
                    order.stripe_payment_intent_id = checkout_session.payment_intent
                    order.save()
                    
                    # УДАЛЯЕМ ТОЛЬКО ВЫБРАННЫЕ ТОВАРЫ из корзины
                    selected_items.delete()
                    
                    checkout_url = checkout_session.url
                    
                except Exception as e:
                    logger.error(f"Stripe error: {str(e)}")
                    raise Exception(f"Payment error: {str(e)}")
            
            elif payment_provider == 'heleket':
                # Списываем выбранные товары со склада
                for item in selected_items:
                    product = item.product
                    product_size = item.product_size
                    
                    if product.stock >= item.quantity:
                        product.stock -= item.quantity
                        product.save()
                    
                    if product_size.stock >= item.quantity:
                        product_size.stock -= item.quantity
                        product_size.save()
                
                # УДАЛЯЕМ ТОЛЬКО ВЫБРАННЫЕ ТОВАРЫ из корзины
                selected_items.delete()
                checkout_url = None
            
            order_serializer = OrderSerializer(order)
            response_data = {
                'order': order_serializer.data,
                'message': 'Заказ успешно создан'
            }
            
            if checkout_url:
                response_data['checkout_url'] = checkout_url
                response_data['message'] = 'Redirect to payment'
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Checkout error: {str(e)}")
            return Response({
                'error': 'Checkout failed',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderListView(APIView):
    """Список заказов пользователя с пагинацией"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 10)
        
        try:
            page_size = int(page_size)
            page_size = min(page_size, 50)
        except (TypeError, ValueError):
            page_size = 10
        
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        
        paginator = Paginator(orders, page_size)
        
        try:
            orders_page = paginator.page(page)
        except PageNotAnInteger:
            orders_page = paginator.page(1)
        except EmptyPage:
            orders_page = paginator.page(paginator.num_pages)
        
        serializer = OrderSerializer(orders_page, many=True)
        
        return Response({
            'orders': serializer.data,
            'pagination': {
                'current_page': orders_page.number,
                'total_pages': paginator.num_pages,
                'total_items': paginator.count,
                'page_size': page_size,
                'has_next': orders_page.has_next(),
                'has_previous': orders_page.has_previous(),
            }
        }, status=status.HTTP_200_OK)


class OrderDetailView(APIView):
    """Детальная информация о заказе"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        serializer = OrderSerializer(order)
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderCancelView(APIView):
    """Отмена заказа"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if order.status != 'pending':
            return Response({
                'error': f'Cannot cancel order with status: {order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Возвращаем товары на склад и в корзину
        from cart.views import CartMixin
        cart_mixin = CartMixin()
        cart = cart_mixin.get_cart(request)

        for item in order.items.select_related('product', 'size'):
            product = item.product
            product_size = item.size
            
            # Возвращаем общий остаток товара
            product.stock += item.quantity
            product.save()
            logger.info(f"Товар '{product.name}': остаток увеличен на {item.quantity}, новый остаток: {product.stock}")
            
            # Возвращаем остаток конкретного размера
            product_size.stock += item.quantity
            product_size.save()
            logger.info(f"Размер '{product_size.size.name}': остаток увеличен на {item.quantity}, новый остаток: {product_size.stock}")
        
            # ВОЗВРАЩАЕМ ТОВАР В КОРЗИНУ
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                product_size=product_size,
                defaults={'quantity': 0}
            )
            cart_item.quantity += item.quantity
            cart_item.save()
            logger.info(f"Товар '{product.name}' возвращён в корзину, количество: {cart_item.quantity}")

        order.status = 'cancelled'
        order.save()
        
        serializer = OrderSerializer(order)
        return Response({
            'message': 'Order cancelled successfully',
            'order': serializer.data
        }, status=status.HTTP_200_OK)