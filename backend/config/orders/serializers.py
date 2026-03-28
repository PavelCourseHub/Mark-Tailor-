from rest_framework import serializers
from .models import Order, OrderItem
from cart.models import CartItem
from main.models import ProductSize
from decimal import Decimal


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    size_name = serializers.CharField(source='size.size.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'size', 'size_name', 
                  'quantity', 'price', 'product_price')
        read_only_fields = ('id', 'price')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Order
        fields = ('id', 'user', 'first_name', 'last_name', 'email', 'company',
                  'address1', 'address2', 'city', 'country', 'province', 
                  'postal_code', 'phone', 'special_instructions', 'status',
                  'total_price', 'created_at', 'payment_provider', 
                  'stripe_payment_intent_id', 'items')
        read_only_fields = ('id', 'user', 'status', 'created_at', 
                           'total_price', 'stripe_payment_intent_id')


class CheckoutRequestSerializer(serializers.Serializer):
    payment_provider = serializers.ChoiceField(choices=['stripe', 'heleket'], required=True)
    first_name = serializers.CharField(max_length=50, required=True)
    last_name = serializers.CharField(max_length=50, required=True)
    email = serializers.EmailField(required=False)
    company = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address1 = serializers.CharField(max_length=250, required=True)
    address2 = serializers.CharField(max_length=250, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=True)
    country = serializers.CharField(max_length=100, required=True)
    province = serializers.CharField(max_length=100, required=True)
    postal_code = serializers.CharField(max_length=20, required=True)
    phone = serializers.CharField(max_length=20, required=True)
    special_instructions = serializers.CharField(required=False, allow_blank=True)
    
    def validate_email(self, value):
        if not value and self.context.get('request') and self.context['request'].user.is_authenticated:
            return self.context['request'].user.email
        return value


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    size_name = serializers.CharField(source='product_size.size.name', read_only=True)
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_name', 'product_size', 'size_name',
                  'quantity', 'product_price', 'subtotal', 'added_at')
    
    def get_subtotal(self, obj):
        return obj.product.price * obj.quantity if obj.product.price else Decimal('0.00')


class CartSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    total_items = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = CartItemSerializer(many=True)


class CheckoutResponseSerializer(serializers.Serializer):
    order = OrderSerializer()
    checkout_url = serializers.URLField(required=False)
    message = serializers.CharField(required=False)