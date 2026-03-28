from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

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


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получить информацию для оформления заказа"""
        cart_mixin = CartMixin()
        cart = cart_mixin.get_cart(request)
        
        logger.debug(f"Checkout GET: user={request.user.id}, cart_id={cart.id}, "
                    f"total_items={cart.total_items}, subtotal={cart.subtotal}")
        
        if cart.total_items == 0:
            return Response({
                'error': 'Cart is empty',
                'message': 'Your cart is empty'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_items = cart.items.select_related('product', 'product_size__size').order_by('-added_at')
        
        cart_data = {
            'id': cart.id,
            'total_items': cart.total_items,
            'subtotal': cart.subtotal,
            'items': cart_items
        }
        cart_serializer = CartSerializer(cart_data)
        
        user_data = {
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email,
            'phone': getattr(request.user, 'phone', ''),
            'address1': getattr(request.user, 'address1', ''),
        }
        
        return Response({
            'cart': cart_serializer.data,
            'user_data': user_data,
            'available_payment_providers': ['stripe', 'heleket']
        }, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def post(self, request):
        """Создать заказ и инициировать оплату"""
        cart_mixin = CartMixin()
        cart = cart_mixin.get_cart(request)
        
        logger.debug(f"Checkout POST: user={request.user.id}, cart_id={cart.id}, "
                    f"total_items={cart.total_items}")
        
        if cart.total_items == 0:
            return Response({
                'error': 'Cart is empty',
                'message': 'Your cart is empty'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CheckoutRequestSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            logger.warning(f"Checkout validation error: {serializer.errors}")
            return Response({
                'error': 'Validation error',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        total_price = cart.subtotal
        
        try:
            order = Order.objects.create(
                user=request.user,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                email=validated_data.get('email') or request.user.email,
                company=validated_data.get('company', ''),
                address1=validated_data['address1'],
                address2=validated_data.get('address2', ''),
                city=validated_data['city'],
                country=validated_data['country'],
                province=validated_data['province'],
                postal_code=validated_data['postal_code'],
                phone=validated_data['phone'],
                special_instructions=validated_data.get('special_instructions', ''),
                total_price=total_price,
                payment_provider=validated_data['payment_provider'],
            )
            
            logger.info(f"Order created: order_id={order.id}")
            
            for item in cart.items.select_related('product', 'product_size'):
                logger.debug(f"Creating order item: product={item.product.name}, "
                           f"size={item.product_size.size.name}, quantity={item.quantity}")
                
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    size=item.product_size,
                    quantity=item.quantity,
                    price=item.product.price or Decimal('0.00')
                )
            
            payment_provider = validated_data['payment_provider']
            checkout_url = None
            
            if payment_provider == 'stripe':
                try:
                    logger.info("Creating Stripe checkout session")
                    import stripe
                    from django.conf import settings
                    
                    stripe.api_key = settings.STRIPE_SECRET_KEY
                    
                    line_items = []
                    for item in cart.items.select_related('product', 'product_size'):
                        product_name = f"{item.product.name}"
                        if item.product_size and item.product_size.size:
                            product_name += f" - {item.product_size.size.name}"
                        
                        line_items.append({
                            'price_data': {
                                'currency': 'eur',
                                'product_data': {
                                    'name': product_name,
                                },
                                'unit_amount': int(item.product.price * 100),
                            },
                            'quantity': item.quantity,
                        })
                    
                    checkout_session = stripe.checkout.Session.create(
                        payment_method_types=['card'],
                        line_items=line_items,
                        mode='payment',
                        success_url=request.build_absolute_uri('/api/payment/stripe/success/') + '?session_id={CHECKOUT_SESSION_ID}',
                        cancel_url=request.build_absolute_uri('/api/payment/stripe/cancel/') + f'?order_id={order.id}',
                        metadata={'order_id': order.id}
                    )
                    
                    order.stripe_payment_intent_id = checkout_session.payment_intent
                    order.save()
                    
                    cart.clear()
                    checkout_url = checkout_session.url
                    
                except Exception as e:
                    logger.error(f"Error creating Stripe session: {str(e)}", exc_info=True)
                    raise Exception(f"Payment processing error: {str(e)}")
            
            elif payment_provider == 'heleket':
                cart.clear()
                logger.info("Heleket payment selected (not implemented yet)")
                checkout_url = None
            
            order_serializer = OrderSerializer(order)
            response_data = {
                'order': order_serializer.data,
                'message': 'Order created successfully'
            }
            
            if checkout_url:
                response_data['checkout_url'] = checkout_url
                response_data['message'] = 'Redirect to payment'
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error during checkout: {str(e)}", exc_info=True)
            return Response({
                'error': 'Checkout failed',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderListView(APIView):
    """Список заказов пользователя"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        
        return Response({
            'orders': serializer.data,
            'count': orders.count()
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
        
        order.status = 'cancelled'
        order.save()
        
        serializer = OrderSerializer(order)
        return Response({
            'message': 'Order cancelled successfully',
            'order': serializer.data
        }, status=status.HTTP_200_OK)