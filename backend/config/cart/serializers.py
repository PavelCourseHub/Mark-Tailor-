from rest_framework import serializers
from .models import Cart, CartItem
from main.models import Product, ProductSize
from decimal import Decimal


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    product_price = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    size_name = serializers.CharField(source='product_size.size.name', read_only=True)
    size_id = serializers.IntegerField(source='product_size.id', read_only=True)
    subtotal = serializers.SerializerMethodField()
    stock_available = serializers.IntegerField(source='product_size.stock', read_only=True)
    
    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_name', 'product_slug', 'product_price', 
                  'product_image', 'product_size', 'size_id', 'size_name', 
                  'quantity', 'subtotal', 'stock_available', 'added_at')
        read_only_fields = ('id', 'added_at')
    
    def get_product_image(self, obj):
        if obj.product.main_image:
            return obj.product.main_image.url
        return None
    
    def get_product_price(self, obj):
        """Возвращает цену со скидкой, если она есть"""
        if obj.product.is_on_sale:
            return float(obj.product.sale_price)
        return float(obj.product.price)
    
    def get_subtotal(self, obj):
        """Считает сумму с учётом скидки"""
        if obj.product.is_on_sale:
            price = obj.product.sale_price
        else:
            price = obj.product.price
        return price * obj.quantity

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ('id', 'session_key', 'items', 'total_items', 'subtotal', 
                  'total_price', 'created_at', 'updated_at')
        read_only_fields = ('id', 'session_key', 'created_at', 'updated_at')
    
    def get_total_price(self, obj):
        return obj.subtotal


class AddToCartSerializer(serializers.Serializer):
    size_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, required=True)
    
    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1")
        return value
    
    def validate_size_id(self, value):
        if value:
            try:
                product_size = ProductSize.objects.get(id=value)
                return value
            except ProductSize.DoesNotExist:
                raise serializers.ValidationError("Size not found")
        return value


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0, required=True)
    
    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative")
        return value


class CartResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField(required=False)
    cart = CartSerializer(required=False)
    total_items = serializers.IntegerField(required=False)
    cart_item_id = serializers.IntegerField(required=False)