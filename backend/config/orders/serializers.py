from rest_framework import serializers
from orders.models import Order, OrderItem
from main.models import Product
from decimal import Decimal


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    size_name = serializers.CharField(source='size.size.name', read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'size', 'size_name', 
                  'quantity', 'price', 'product_price', 'total_price')
        read_only_fields = ('id', 'price')
    
    def get_total_price(self, obj):
        return obj.price * obj.quantity


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    status_display = serializers.SerializerMethodField()
    payment_method_display = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ('id', 'user', 'first_name', 'last_name', 'email', 'company',
                  'address1', 'address2', 'city', 'country', 'province', 
                  'postal_code', 'phone', 'special_instructions', 'status',
                  'status_display', 'total_price', 'created_at', 'updated_at', 'payment_provider', 
                  'payment_method_display', 'stripe_payment_intent_id', 'items')
        read_only_fields = ('id', 'user', 'status', 'status_display', 'created_at', 'updated_at', 'total_price')

    def get_status_display(self, obj):
        status_map = dict(Order.STATUS_CHOICES)
        return status_map.get(obj.status, obj.status)
    
    def get_payment_method_display(self, obj):  # 👈 ДОБАВИТЬ
        """Возвращает человекочитаемое название способа оплаты"""
        if obj.payment_provider == 'heleket':
            return 'Оплата при получении'
        elif obj.payment_provider == 'stripe':
            return 'Банковская карта'
        return obj.payment_provider or 'Не указан'

class CheckoutRequestSerializer(serializers.Serializer):
    # Обязательные поля
    payment_provider = serializers.ChoiceField(choices=['stripe', 'heleket'], required=True)
    first_name = serializers.CharField(max_length=50, required=True)
    last_name = serializers.CharField(max_length=50, required=True)
    
    # Необязательные поля
    email = serializers.EmailField(required=False, allow_blank=True)
    company = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    special_instructions = serializers.CharField(required=False, allow_blank=True)
    
    # Адресные поля - необязательные по умолчанию
    address1 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address2 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    country = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    province = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    postal_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Способ доставки (по умолчанию pickup)
    delivery_method = serializers.ChoiceField(choices=['pickup', 'courier'], required=False, default='pickup')
    
    def validate(self, attrs):
        delivery_method = attrs.get('delivery_method', 'pickup')
        
        # Только для курьерской доставки проверяем наличие адреса
        if delivery_method == 'courier':
            if not attrs.get('address1'):
                raise serializers.ValidationError({'address1': 'Address is required for courier delivery'})
            if not attrs.get('city'):
                raise serializers.ValidationError({'city': 'City is required for courier delivery'})
            if not attrs.get('country'):
                raise serializers.ValidationError({'country': 'Country is required for courier delivery'})
        
        return attrs


class CartItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    product_slug = serializers.CharField()
    product_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    size_id = serializers.IntegerField()
    size_name = serializers.CharField()
    quantity = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    stock_available = serializers.IntegerField()
    product_image = serializers.CharField(allow_null=True)


class CartSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    total_items = serializers.IntegerField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = CartItemSerializer(many=True)


class CheckoutResponseSerializer(serializers.Serializer):
    order = OrderSerializer()
    checkout_url = serializers.URLField(required=False)
    message = serializers.CharField(required=False)