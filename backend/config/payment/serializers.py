from rest_framework import serializers
from orders.models import Order


class StripeCheckoutSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=True)
    success_url = serializers.URLField(required=False)
    cancel_url = serializers.URLField(required=False)

    def validate_order_id(self, value):
        try:
            order = Order.objects.get(id=value)
            if order.status != 'pending':
                raise serializers.ValidationError("Order is not in pending status")
            return value
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order does not exist")


class PaymentStatusSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    order_status = serializers.CharField()
    payment_provider = serializers.CharField(allow_null=True)
    payment_intent_id = serializers.CharField(allow_null=True)
    payment_status = serializers.CharField(required=False)
    payment_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    payment_currency = serializers.CharField(required=False)


class PaymentResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    session_id = serializers.CharField(required=False)
    session_url = serializers.URLField(required=False)
    order_id = serializers.IntegerField()
    payment_intent_id = serializers.CharField(required=False)