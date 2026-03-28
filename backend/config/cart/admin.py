"""
Настраиваем административный интерфейс Django (admin panel) 
для моделей корзины покупок (Cart, CartItem, CartHistory).
"""

from django.contrib import admin
from .models import Cart, CartItem, CartHistory


class CartItemInline(admin.TabularInline):
    """
    Просмотр и редактирование товаров корзины 
    прямо на странице редактирования самой корзины, в виде таблицы.
    """
    model = CartItem
    extra = 0
    readonly_fields = ('total_price',)
    fields = ('product', 'product_size', 'quantity', 'total_price')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """
    Административный класс для корзин
    """
    list_display = ('id', 'user', 'session_key', 'total_items', 
                    'subtotal', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('session_key', 'user__email', 'user__username', 'user__first_name')
    inlines = [CartItemInline]
    readonly_fields = ('total_items', 'subtotal')
    list_select_related = ('user',)
    
    fieldsets = (
        ('Информация о корзине', {
            'fields': ('user', 'session_key')
        }),
        ('Статистика', {
            'fields': ('total_items', 'subtotal'),
            'classes': ('collapse',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Оптимизируем запросы с select_related"""
        return super().get_queryset(request).select_related('user').prefetch_related('items')
    
    actions = ['clear_selected_carts']
    
    def clear_selected_carts(self, request, queryset):
        """Действие: очистить выбранные корзины"""
        count = 0
        for cart in queryset:
            cart.clear()
            count += 1
        self.message_user(request, f'Очищено {count} корзин(а)')
    clear_selected_carts.short_description = 'Очистить выбранные корзины'


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    """
    Административный класс для товаров корзины
    """
    list_display = ('id', 'cart', 'product', 'product_size', 
                    'quantity', 'total_price', 'added_at', 'updated_at')
    list_filter = ('added_at', 'product__category')
    search_fields = ('product__name', 'cart__session_key', 'cart__user__email')
    readonly_fields = ('total_price',)
    list_select_related = ('cart', 'product', 'product_size__size')
    
    fieldsets = (
        ('Информация о корзине', {
            'fields': ('cart',)
        }),
        ('Информация о товаре', {
            'fields': ('product', 'product_size')
        }),
        ('Количество и цена', {
            'fields': ('quantity', 'total_price')
        }),
        ('Даты', {
            'fields': ('added_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Оптимизируем запросы с select_related"""
        return super().get_queryset(request).select_related(
            'cart', 'cart__user', 'product', 'product_size', 'product_size__size'
        )


@admin.register(CartHistory)
class CartHistoryAdmin(admin.ModelAdmin):
    """
    Административный класс для истории корзин
    """
    list_display = ('id', 'action', 'user', 'cart', 'product_name', 
                    'quantity', 'price', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('product_name', 'cart__session_key', 'user__email', 
                     'session_key')
    readonly_fields = ('action', 'product_name', 'quantity', 'price', 
                       'created_at', 'session_key', 'user', 'cart')
    date_hierarchy = 'created_at'
    list_select_related = ('cart', 'user')
    
    fieldsets = (
        ('Действие', {
            'fields': ('action',)
        }),
        ('Пользователь', {
            'fields': ('user', 'session_key')
        }),
        ('Корзина', {
            'fields': ('cart',)
        }),
        ('Информация о товаре', {
            'fields': ('product_name', 'quantity', 'price')
        }),
        ('Дата', {
            'fields': ('created_at',)
        }),
    )
    
    def has_add_permission(self, request):
        """Запрещаем добавление записей вручную"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Запрещаем изменение записей"""
        return False
    
    def get_queryset(self, request):
        """Оптимизируем запросы с select_related"""
        return super().get_queryset(request).select_related('user', 'cart')