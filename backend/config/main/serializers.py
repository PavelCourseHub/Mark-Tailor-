from rest_framework import serializers
from .models import Category, Product, Size, ProductSize, ProductImage
from decimal import Decimal



class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    all_images = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'image_url', 
                  'image_2', 'image_3', 'image_4', 'all_images', 'created_at', 
                  'parent', 'children', 'order')
        read_only_fields = ('id', 'created_at')
    
    def get_all_images(self, obj):
        """Собирает все непустые изображения категории"""
        images = []
        if obj.image:
            images.append(obj.image.url)
        if obj.image_2:
            images.append(obj.image_2.url)
        if obj.image_3:
            images.append(obj.image_3.url)
        if obj.image_4:
            images.append(obj.image_4.url)
        return images

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
    
    def get_children(self, obj):
        """Возвращает подкатегории для данной категории"""
        children = obj.children.all().order_by('name')
        return CategorySerializer(children, many=True, context=self.context).data


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ('id', 'name', 'value', 'sort_order')
        read_only_fields = ('id',)


class ProductSizeSerializer(serializers.ModelSerializer):
    size_name = serializers.CharField(source='size.name', read_only=True)
    size_id = serializers.IntegerField(source='size.id', read_only=True)
    
    class Meta:
        model = ProductSize
        fields = ('id', 'size', 'size_id', 'size_name', 'stock')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'sort_order')


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    sizes = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    price_display = serializers.SerializerMethodField()
    sale_price_display = serializers.SerializerMethodField()
    discount_badge = serializers.SerializerMethodField()
    stock_available = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'description', 'price', 'sale_price', 
                  'discount_percent', 'is_on_sale', 'price_display', 'sale_price_display',
                  'discount_badge', 'main_image', 'image_url', 'category', 
                  'category_name', 'category_slug', 'sizes', 'images', 'color', 
                  'stock', 'stock_available', 'is_active', 'is_featured', 
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_image_url(self, obj):
        if obj.main_image:
            return obj.main_image.url
        return None
    
    def get_price_display(self, obj):
        if obj.is_on_sale:
            return f"{int(round(obj.sale_price))} BYN"
        return f"{int(round(obj.price))} BYN"
    
    def get_sale_price_display(self, obj):
        if obj.is_on_sale:
            return f"{int(round(obj.sale_price))} BYN"
        return None
    
    def get_discount_badge(self, obj):
        if obj.discount_percent > 0:
            return f"-{obj.discount_percent}%"
        return None
    
    def get_sizes(self, obj):
        product_sizes = obj.product_sizes.select_related('size').all()
        return [
            {
                'id': ps.id,
                'size_id': ps.size.id,
                'name': ps.size.name,
                'stock': ps.stock
            }
            for ps in product_sizes
        ]
    
    def get_stock_available(self, obj):
        return obj.stock


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
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0, coerce_to_string=False)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0, coerce_to_string=False)
    size = serializers.CharField(required=False, allow_blank=True)
    sort = serializers.ChoiceField(
        choices=['price_asc', 'price_desc', 'newest', 'name_asc'], 
        required=False
    )
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