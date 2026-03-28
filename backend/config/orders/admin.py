from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """
    Просмотр товаров в заказе прямо на странице заказа
    """
    model = OrderItem
    extra = 0
    fields = ('product', 'size', 'quantity', 'price', 'total_price')
    readonly_fields = ('total_price',)
    can_delete = False
    
    def total_price(self, obj):
        """Общая стоимость позиции"""
        return obj.total_price
    total_price.short_description = 'Total Price'


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """
    Административный класс для заказов
    """
    list_display = ('id', 'user_info', 'email', 'total_price_display', 
                    'payment_provider', 'status', 'items_count', 'created_at')
    list_filter = ('status', 'payment_provider', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'user__email', 'user__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at', 'total_price_display', 
                       'stripe_payment_intent_id', 'items_summary')
    inlines = [OrderItemInline]
    list_select_related = ('user',)
    
    fieldsets = (
        ('Информация о заказе', {
            'fields': ('user', 'first_name', 'last_name', 'email', 
                       'company', 'address1', 'address2', 'city',
                       'country', 'province', 'postal_code',
                       'phone', 'special_instructions')
        }),
        ('Финансовая информация', {
            'fields': ('total_price_display', 'payment_provider', 'stripe_payment_intent_id')
        }),
        ('Статус', {
            'fields': ('status',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_info(self, obj):
        """Отображает информацию о пользователе"""
        if obj.user:
            return f"{obj.user.get_full_name() or obj.user.username}\n({obj.user.id})"
        return "Гость"
    user_info.short_description = 'Пользователь'
    
    def total_price_display(self, obj):
        """Отображает сумму заказа"""
        return f"€{obj.total_price:.2f}"
    total_price_display.short_description = 'Сумма заказа'
    
    def items_count(self, obj):
        """Количество товаров в заказе"""
        return obj.items.count()
    items_count.short_description = 'Товаров'
    
    def items_summary(self, obj):
        """Краткая сводка по товарам (для админки)"""
        items = obj.items.select_related('product', 'size__size')
        if not items:
            return "Нет товаров"
        
        summary = []
        for item in items:
            summary.append(f"{item.product.name} - {item.size.size.name} x {item.quantity}")
        
        return "\n".join(summary)
    items_summary.short_description = 'Состав заказа'
    
    def get_readonly_fields(self, request, obj=None):
        """Делаем поля только для чтения при редактировании существующего заказа"""
        if obj:  # Существующий заказ
            return self.readonly_fields + ('user', 'first_name', 'last_name', 'email', 
                                           'company', 'address1', 'address2', 'city',
                                           'country', 'province', 'postal_code', 'phone',
                                           'total_price_display', 'payment_provider')
        return self.readonly_fields
    
    def get_queryset(self, request):
        """Оптимизируем запросы с select_related и prefetch_related"""
        return super().get_queryset(request).select_related('user').prefetch_related('items')
    
    actions = ['mark_as_processing', 'mark_as_completed', 'mark_as_cancelled']
    
    def mark_as_processing(self, request, queryset):
        """Действие: отметить заказы как 'В обработке'"""
        updated = queryset.update(status='processing')
        self.message_user(request, f'{updated} заказ(ов) отмечен(ы) как "В обработке"')
    mark_as_processing.short_description = 'Отметить как "В обработке"'
    
    def mark_as_completed(self, request, queryset):
        """Действие: отметить заказы как 'Завершен'"""
        updated = queryset.update(status='completed')
        self.message_user(request, f'{updated} заказ(ов) отмечен(ы) как "Завершен"')
    mark_as_completed.short_description = 'Отметить как "Завершен"'
    
    def mark_as_cancelled(self, request, queryset):
        """Действие: отметить заказы как 'Отменен'"""
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} заказ(ов) отмечен(ы) как "Отменен"')
    mark_as_cancelled.short_description = 'Отметить как "Отменен"'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """
    Административный класс для товаров в заказе
    """
    list_display = ('id', 'order_info', 'product_info', 'size_info', 
                    'quantity', 'price_display', 'total_price_display')
    list_filter = ('order__status', 'order__created_at')
    search_fields = ('product__name', 'order__email', 'order__user__email')
    readonly_fields = ('total_price_display',)
    list_select_related = ('order', 'order__user', 'product', 'size__size')
    
    fieldsets = (
        ('Информация о заказе', {
            'fields': ('order',)
        }),
        ('Информация о товаре', {
            'fields': ('product', 'size', 'quantity', 'price', 'total_price_display')
        }),
    )
    
    def order_info(self, obj):
        """Информация о заказе"""
        return f"Order #{obj.order.id} - {obj.order.email}"
    order_info.short_description = 'Заказ'
    
    def product_info(self, obj):
        """Информация о товаре"""
        return obj.product.name
    product_info.short_description = 'Товар'
    
    def size_info(self, obj):
        """Информация о размере"""
        if obj.size and obj.size.size:
            return obj.size.size.name
        return '-'
    size_info.short_description = 'Размер'
    
    def price_display(self, obj):
        """Отображение цены"""
        return f"€{obj.price:.2f}"
    price_display.short_description = 'Цена за ед.'
    
    def total_price_display(self, obj):
        """Отображение общей стоимости"""
        return f"€{obj.total_price:.2f}"
    total_price_display.short_description = 'Общая стоимость'
    
    def get_queryset(self, request):
        """Оптимизируем запросы с select_related"""
        return super().get_queryset(request).select_related(
            'order', 'order__user', 'product', 'size__size'
        )