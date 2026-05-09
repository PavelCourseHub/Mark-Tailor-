from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, Size, ProductSize, ProductImage, Subscriber, Review, Coupon


class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1
    fields = ('size', 'stock')


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'sort_order')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'order', 'slug')
    list_filter = ('parent',)
    search_fields = ('name', 'slug')
    list_editable = ('order',)
    list_select_related = ('parent',)
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'slug', 'parent', 'order')
        }),
        ('Контент', {
            'fields': ('description', 'image', 'image_2', 'image_3', 'image_4')
        }),
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'discount_percent', 'sale_price_display', 
                    'is_on_sale', 'stock', 'average_rating_display')
    list_filter = ('category', 'is_on_sale')
    list_editable = ('discount_percent',)
    search_fields = ('name',)
    inlines = [ProductSizeInline, ProductImageInline]
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'slug', 'category', 'color', 'description')
        }),
        ('Цена и скидки', {
            'fields': ('price', 'discount_percent', 'sale_price', 'is_on_sale'),
            'classes': ('wide',)
        }),
        ('Изображения и наличие', {
            'fields': ('main_image', 'stock', 'is_active', 'is_featured')
        }),
    )
    readonly_fields = ('sale_price',)
    
    def sale_price_display(self, obj):
        if obj.discount_percent > 0:
            return format_html('<span style="color: red;">{} BYN</span>', obj.sale_price)
        return '-'
    sale_price_display.short_description = 'Цена со скидкой'
    
    def average_rating_display(self, obj):
        avg = obj.get_average_rating()
        if avg:
            return format_html('<span style="color: #2b8c4e;">★ {:.1f}</span>', avg)
        return '-'
    average_rating_display.short_description = 'Рейтинг'


@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ('name', 'value', 'sort_order')
    list_editable = ('sort_order',)


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'subscribed_at', 'is_active')
    list_filter = ('is_active', 'subscribed_at')
    search_fields = ('email',)
    actions = ['activate_subscribers', 'deactivate_subscribers']
    
    def activate_subscribers(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f'{queryset.count()} подписчик(ов) активированы')
    activate_subscribers.short_description = 'Активировать выбранных подписчиков'
    
    def deactivate_subscribers(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} подписчик(ов) деактивированы')
    deactivate_subscribers.short_description = 'Деактивировать выбранных подписчиков'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'rating', 'is_verified_purchase', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_approved', 'is_verified_purchase', 'created_at')
    search_fields = ('product__name', 'user__email', 'comment')
    list_editable = ('is_approved',)
    readonly_fields = ('user', 'product', 'rating', 'comment', 'helpful_count', 'created_at')
    
    fieldsets = (
        ('Информация об отзыве', {
            'fields': ('product', 'user', 'rating', 'comment')
        }),
        ('Фото', {
            'fields': ('image',),
            'classes': ('collapse',)
        }),
        ('Статусы', {
            'fields': ('is_verified_purchase', 'is_approved', 'helpful_count')
        }),
        ('Дата', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    actions = ['approve_reviews', 'unapprove_reviews']
    
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, f'{queryset.count()} отзывов одобрено')
    approve_reviews.short_description = 'Одобрить выбранные отзывы'
    
    def unapprove_reviews(self, request, queryset):
        queryset.update(is_approved=False)
        self.message_user(request, f'{queryset.count()} отзывов скрыто')
    unapprove_reviews.short_description = 'Скрыть выбранные отзывы'


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_value', 'discount_type', 'min_order_amount', 
                    'used_count', 'usage_limit', 'valid_from', 'valid_to', 'is_active')
    list_filter = ('discount_type', 'is_active', 'valid_from', 'valid_to')
    search_fields = ('code',)
    list_editable = ('is_active',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('code', 'discount_type', 'discount_value', 'min_order_amount', 'max_discount_amount')
        }),
        ('Лимиты использований', {
            'fields': ('usage_limit', 'per_user_limit', 'used_count')
        }),
        ('Применение', {
            'fields': ('applicable_categories', 'applicable_products')
        }),
        ('Даты и статус', {
            'fields': ('valid_from', 'valid_to', 'is_active')
        }),
    )
    
    actions = ['activate_coupons', 'deactivate_coupons']
    
    def activate_coupons(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f'{queryset.count()} промокодов активировано')
    activate_coupons.short_description = 'Активировать промокоды'
    
    def deactivate_coupons(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} промокодов деактивировано')
    deactivate_coupons.short_description = 'Деактивировать промокоды'