from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import stripe
import logging
from decimal import Decimal

from orders.models import Order
from cart.views import CartMixin
from django.shortcuts import redirect

logger = logging.getLogger(__name__)

# Настройка Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
stripe_endpoint_secret = settings.STRIPE_WEBHOOK_SECRET


class CreateStripeCheckoutSessionView(APIView):
    """
    Создание Stripe checkout сессии для оплаты заказа
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        success_url = request.data.get('success_url')
        cancel_url = request.data.get('cancel_url')
        
        if not order_id:
            return Response({
                'error': 'order_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order = get_object_or_404(Order, id=order_id, user=request.user)

        # Проверяем, что заказ принадлежит пользователю и ожидает оплаты
        if order.status != 'pending':
            return Response({
                'error': 'Order is not pending payment',
                'order_status': order.status
            }, status=status.HTTP_400_BAD_REQUEST)

        # Получаем корзину
        cart_mixin = CartMixin()
        cart = cart_mixin.get_cart(request)
        
        # Проверяем, что корзина не пуста
        if cart.total_items == 0:
            return Response({
                'error': 'Cart is empty'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Создаем line items для Stripe
        line_items = []
        for item in cart.items.select_related('product', 'product_size'):
            product_name = f"{item.product.name}"
            if hasattr(item, 'product_size') and item.product_size:
                product_name += f" - {item.product_size.size.name}"
            
            line_items.append({
                'price_data': {
                    'currency': 'byn',
                    'product_data': {
                        'name': product_name,
                    },
                    'unit_amount': int(item.product.price * 100),
                },
                'quantity': item.quantity,
            })

        try:
            # Определяем URL для успешной оплаты и отмены
            default_success_url = request.build_absolute_uri('/api/payment/stripe/success/')
            default_cancel_url = request.build_absolute_uri('/api/payment/stripe/cancel/')
            
            # Создаем Stripe checkout session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=(success_url or default_success_url) + '?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=(cancel_url or default_cancel_url) + f'?order_id={order.id}',
                metadata={
                    'order_id': order.id,
                    'user_id': request.user.id
                },
                client_reference_id=str(order.id)
            )

            # Обновляем заказ
            order.stripe_payment_intent_id = checkout_session.payment_intent
            order.payment_provider = 'stripe'
            order.save()

            logger.info(f"Stripe checkout session created: session_id={checkout_session.id}, order_id={order.id}")

            return Response({
                'session_id': checkout_session.id,
                'session_url': checkout_session.url,
                'order_id': order.id,
                'payment_intent_id': checkout_session.payment_intent
            }, status=status.HTTP_200_OK)

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return Response({
                'error': 'Payment provider error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating Stripe session: {str(e)}")
            return Response({
                'error': 'Payment processing error',
                'message': 'Unable to create payment session'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreatePaymentIntentView(APIView):
    """
    Создание Payment Intent для Stripe Elements (без редиректа)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response({
                'error': 'order_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order = get_object_or_404(Order, id=order_id, user=request.user)

        if order.status != 'pending':
            return Response({
                'error': 'Order is not pending payment'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=int(order.total_price * 100),
                currency='eur',
                metadata={
                    'order_id': order.id,
                    'user_id': request.user.id
                }
            )

            order.stripe_payment_intent_id = payment_intent.id
            order.payment_provider = 'stripe'
            order.save()

            return Response({
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id
            }, status=status.HTTP_200_OK)

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating PaymentIntent: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating PaymentIntent: {str(e)}")
            return Response({
                'error': 'Failed to create payment intent'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    """
    Обработка webhook событий от Stripe
    """
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        if not stripe_endpoint_secret:
            logger.error("Stripe webhook secret is not configured")
            return HttpResponse(status=500)

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, stripe_endpoint_secret
            )
            logger.info(f"Stripe webhook received: event_type={event['type']}, event_id={event['id']}")
        except ValueError as e:
            logger.error(f"Invalid Stripe webhook payload: {str(e)}")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid Stripe webhook signature: {str(e)}")
            return HttpResponse(status=400)

        # Обрабатываем различные типы событий
        event_type = event['type']
        
        if event_type == 'checkout.session.completed':
            self.handle_checkout_session_completed(event['data']['object'])
        
        elif event_type == 'checkout.session.expired':
            self.handle_checkout_session_expired(event['data']['object'])
        
        elif event_type == 'payment_intent.payment_failed':
            self.handle_payment_intent_failed(event['data']['object'])
        
        elif event_type == 'payment_intent.succeeded':
            self.handle_payment_intent_succeeded(event['data']['object'])
        
        else:
            logger.info(f"Unhandled Stripe webhook event: {event_type}")

        return HttpResponse(status=200)
    
    def handle_checkout_session_completed(self, session):
        """Обработка успешного завершения checkout сессии"""
        order_id = session.get('metadata', {}).get('order_id')
        
        if not order_id:
            logger.error("No order_id in session metadata")
            return
        
        try:
            order = Order.objects.get(id=order_id)
            order.status = 'processing'
            order.stripe_payment_intent_id = session.get('payment_intent')
            order.save()
            
            logger.info(f"Order {order_id} status updated to processing after successful payment")
            
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found for checkout session completion")
    
    def handle_checkout_session_expired(self, session):
        """Обработка истекшей checkout сессии"""
        order_id = session.get('metadata', {}).get('order_id')
        
        if not order_id:
            return
        
        try:
            order = Order.objects.get(id=order_id)
            if order.status == 'pending':
                order.status = 'cancelled'
                order.save()
                logger.info(f"Order {order_id} cancelled due to expired checkout session")
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found for expired checkout session")
    
    def handle_payment_intent_failed(self, payment_intent):
        """Обработка неудачной попытки оплаты"""
        order_id = payment_intent.get('metadata', {}).get('order_id')
        
        if not order_id:
            return
        
        try:
            order = Order.objects.get(id=order_id)
            if order.status == 'pending':
                order.status = 'failed'
                order.save()
                logger.warning(f"Order {order_id} payment failed")
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found for failed payment intent")
    
    def handle_payment_intent_succeeded(self, payment_intent):
        """Обработка успешного платежа"""
        order_id = payment_intent.get('metadata', {}).get('order_id')
        
        if not order_id:
            return
        
        try:
            order = Order.objects.get(id=order_id)
            if order.status == 'pending':
                order.status = 'processing'
                order.save()
                logger.info(f"Order {order_id} payment succeeded via payment_intent")
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found for succeeded payment intent")


class StripeSuccessView(APIView):
    """
    Обработка успешной оплаты (редирект со Stripe)
    """
    #permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        
        if not session_id:
            #return Response({
            #    'error': 'Session ID is required'
            #}, status=status.HTTP_400_BAD_REQUEST)
            return redirect('/cart')

        try:
            # Получаем сессию из Stripe
            session = stripe.checkout.Session.retrieve(session_id)
            order_id = session.metadata.get('order_id')
            
            #ДОБАВИЛИ ДЛЯ ТЕСТА
            if order_id:
                order = Order.objects.get(id=order_id)
                if order.status == 'pending':
                    order.status = 'processing'
                    order.save()

            # Очищаем корзину пользователя (если есть request.user)
                if request.user.is_authenticated:
                    from cart.views import CartMixin
                    cart_mixin = CartMixin()
                    cart = cart_mixin.get_cart(request)
                    if cart and cart.total_items > 0:
                        cart.clear()
            
            return redirect(f'http://localhost:3000/payment/success?order_id={order_id}')
            
        except Exception as e:
            logger.error(f"Error on payment success: {str(e)}", exc_info=True)
            return redirect('/cart')
            
            #if not order_id:
            #    return Response({
            #        'error': 'No order ID in session'
            #    }, status=status.HTTP_400_BAD_REQUEST)
            
            #order = get_object_or_404(Order, id=order_id, user=request.user)

            # Проверяем, что заказ действительно оплачен
            #if order.status not in ['processing', 'completed']:
            #    logger.warning(f"Order {order_id} status is {order.status} on success callback")
            
            # Очищаем корзину пользователя
            #cart_mixin = CartMixin()
            #cart = cart_mixin.get_cart(request)
            #if cart and cart.total_items > 0:
            #    cart.clear()
            #    logger.info(f"Cart cleared for user {request.user.id} after successful payment")

            #from orders.serializers import OrderSerializer
            #order_serializer = OrderSerializer(order)
            
            #response_data = {
            #    'message': 'Payment successful',
            #    'order': order_serializer.data,
            #    'session_id': session_id
            #}
            
            #return Response(response_data, status=status.HTTP_200_OK)

        #except stripe.error.StripeError as e:
        #    logger.error(f"Stripe error on success: {str(e)}")
        #    return Response({
        #        'error': 'Failed to verify payment',
        #        'message': str(e)
        #    }, status=status.HTTP_400_BAD_REQUEST)
        #except Exception as e:
        #    logger.error(f"Error on payment success: {str(e)}", exc_info=True)
        #    return Response({
        #        'error': 'Payment verification error',
        #        'message': 'Unable to verify payment status'
        #    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripeCancelView(APIView):
    """
    Обработка отмены оплаты (редирект со Stripe)
    """
    #permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny] 

    def get(self, request):
        order_id = request.query_params.get('order_id')
        
        if not order_id:
            #return Response({
            #    'error': 'Order ID is required',
            #    'redirect_url': '/cart'
            #}, status=status.HTTP_400_BAD_REQUEST)
            return redirect('/cart')

        try:
            #order = get_object_or_404(Order, id=order_id, user=request.user)
            order = Order.objects.get(id=order_id)

            # Отменяем заказ только если он еще не обработан
            if order.status == 'pending':
                order.status = 'cancelled'
                order.save()
                logger.info(f"Заказ {order_id} отменен пользователем во время оплаты")
            
            # Перенаправляем на страницу с сообщением об отмене
            return redirect(f'http://localhost:3000/payment/cancel?order_id={order_id}')
            
        except Order.DoesNotExist:
            logger.error(f"Order {order_id} not found")
            return redirect('/cart')
        except Exception as e:
            logger.error(f"Ошибка при отмене платежа: {str(e)}", exc_info=True)
            return redirect('/cart')

            from orders.serializers import OrderSerializer
            order_serializer = OrderSerializer(order)
            
            return Response({
                'message': 'Payment cancelled',
                'order': order_serializer.data,
                'redirect_url': '/cart'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error on payment cancel: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to cancel order',
                'message': str(e),
                'redirect_url': '/cart'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentStatusView(APIView):
    """
    Проверка статуса платежа для заказа
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        response_data = {
            'order_id': order.id,
            'order_status': order.status,
            'payment_provider': order.payment_provider,
            'payment_intent_id': order.stripe_payment_intent_id
        }
        
        # Если есть Stripe payment intent, проверяем его статус
        if order.stripe_payment_intent_id and order.payment_provider == 'stripe':
            try:
                payment_intent = stripe.PaymentIntent.retrieve(
                    order.stripe_payment_intent_id
                )
                
                response_data.update({
                    'payment_status': payment_intent.status,
                    'payment_amount': payment_intent.amount / 100,  # конвертируем из центов
                    'payment_currency': payment_intent.currency
                })
                
            except stripe.error.StripeError as e:
                logger.error(f"Ошибка при оплате {order.stripe_payment_intent_id}: {str(e)}")
                response_data['payment_status'] = 'unknown'
                response_data['error'] = str(e)
        
        return Response(response_data, status=status.HTTP_200_OK)


class StripeConfigView(APIView):
    """
    Получение конфигурации Stripe (публичный ключ)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'stripe_public_key': getattr(settings, 'STRIPE_PUBLIC_KEY', ''),
            'stripe_api_version': '2023-10-16'
        }, status=status.HTTP_200_OK)