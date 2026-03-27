# Настраиваем административный интерфейс Django (admin panel) 
# для моделей корзины покупок (Cart и CartItem).

from django.contrib import admin
from .models import Cart, CartItem

# Просмотр и редактирование товары корзины 
# прямо на странице редактирования самой корзины, в виде таблицы.
class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('total_price',)

# Административный класс для корзин
@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('session_key', 'total_items', 'subtotal', 'created_at',
                    'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('session_key',)
    inlines = [CartItemInline]
    readonly_fields = ('total_items', 'subtotal')

# Административный класс для товаров корзины
@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'product_size',
                    'quantity', 'total_price', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('product__name', 'cart__session_key')
    readonly_fields = ('total_price',)