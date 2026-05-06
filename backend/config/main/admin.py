from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, Size, ProductSize, ProductImage, Subscriber


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
    prepopulated_fields = {'slug': ('name',)}  # 👈 ДОБАВЛЕНО
    
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
    list_display = ('name', 'category', 'price', 'discount_percent', 'sale_price_display', 'is_on_sale', 'stock')
    list_filter = ('category', 'is_on_sale')
    list_editable = ('discount_percent',)
    search_fields = ('name',)
    inlines = [ProductSizeInline, ProductImageInline]
    prepopulated_fields = {'slug': ('name',)}  # 👈 ДОБАВЛЕНО
    
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
            return format_html(
                '<span style="color: red;">{} BYN</span>',
                obj.sale_price
            )
        return '-'
    sale_price_display.short_description = 'Цена со скидкой'


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