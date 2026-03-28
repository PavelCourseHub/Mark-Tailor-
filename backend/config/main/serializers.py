from rest_framework import serializers
from .models import Category, Product, Size
from decimal import Decimal


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'created_at')
        read_only_fields = ('id', 'created_at')


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ('id', 'name', 'value')
        read_only_fields = ('id',)


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    sizes = SizeSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    price_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'description', 'price', 'price_display',
                  'image', 'image_url', 'category', 'category_name', 'category_slug',
                  'sizes', 'color', 'stock', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
    
    def get_price_display(self, obj):
        return f"€{obj.price:.2f}" if obj.price else "€0.00"


class ProductDetailSerializer(ProductSerializer):
    related_products = serializers.SerializerMethodField()
    
    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ('related_products',)
    
    def get_related_products(self, obj):
        related = Product.objects.filter(
            category=obj.category
        ).exclude(id=obj.id)[:4]
        return ProductSerializer(related, many=True, context=self.context).data


class FilterParamsSerializer(serializers.Serializer):
    q = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    color = serializers.CharField(required=False, allow_blank=True)
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0)
    size = serializers.CharField(required=False, allow_blank=True)
    sort = serializers.ChoiceField(choices=['price_asc', 'price_desc', 'newest', 'name_asc'], required=False)
    show_filters = serializers.BooleanField(required=False, default=False)
    show_search = serializers.BooleanField(required=False, default=False)
    reset_search = serializers.BooleanField(required=False, default=False)
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=100, default=20)


class PaginatedProductSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(required=False, allow_null=True)
    previous = serializers.URLField(required=False, allow_null=True)
    results = ProductSerializer(many=True)
    filter_params = FilterParamsSerializer()