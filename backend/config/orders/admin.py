from django.contrib import admin
from django.http import HttpResponse
from .models import Order, OrderItem

import csv


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ('product', 'size', 'quantity', 'price', 'total_price')
    readonly_fields = ('total_price',)
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_info', 'email', 'total_price_display', 
                    'payment_provider_display', 'status', 'items_count', 'created_at')
    list_filter = ('status', 'payment_provider', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'user__email')
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]
    list_select_related = ('user',)

    # Действия для массового экспорта
    actions = ['export_selected_csv', 'mark_as_processing', 'mark_as_shipped', 
               'mark_as_delivered', 'mark_as_cancelled']

    def export_selected_csv(self, request, queryset):
        """Экспорт выбранных заказов в CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="orders_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Email', 'Имя', 'Фамилия', 'Телефон', 'Сумма (BYN)', 
                         'Статус', 'Способ оплаты', 'Дата', 'Товары'])
        
        for order in queryset:
            items = []
            for item in order.items.all():
                items.append(f"{item.product.name} ({item.size.size.name}) x{item.quantity} = {float(item.total_price):.2f} BYN")
            items_str = '; '.join(items)
            
            writer.writerow([
                order.id,
                order.email,
                order.first_name,
                order.last_name,
                order.phone or '-',
                float(order.total_price),
                order.get_status_display(),
                self.get_payment_provider_display(order),
                order.created_at.strftime('%Y-%m-%d %H:%M'),
                items_str
            ])
        
        self.message_user(request, f'✅ Экспортировано {queryset.count()} заказов в CSV')
        return response
    export_selected_csv.short_description = '📊 Экспортировать выбранные заказы в CSV'

    # Вспомогательные методы
    def user_info(self, obj):
        if obj.user:
            return f"{obj.user.get_full_name() or obj.user.email}"
        return "Гость"
    user_info.short_description = 'Пользователь'

    def total_price_display(self, obj):
        return f"{float(obj.total_price):.2f} BYN"
    total_price_display.short_description = 'Сумма'

    def payment_provider_display(self, obj):
        providers = {
            'stripe': 'Банковская карта',
            'heleket': 'Оплата при получении',
        }
        return providers.get(obj.payment_provider, obj.payment_provider or '-')
    payment_provider_display.short_description = 'Способ оплаты'
    
    def get_payment_provider_display(self, obj):
        providers = {
            'stripe': 'Банковская карта',
            'heleket': 'Оплата при получении',
        }
        return providers.get(obj.payment_provider, obj.payment_provider or '-')

    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Товаров'

    # Действия для изменения статусов
    def mark_as_processing(self, request, queryset):
        updated = queryset.update(status='processing')
        self.message_user(request, f'✅ {updated} заказ(ов) отмечен(ы) как "В обработке"')
    mark_as_processing.short_description = '🔄 В обработке'

    def mark_as_shipped(self, request, queryset):
        updated = queryset.update(status='shipped')
        self.message_user(request, f'✅ {updated} заказ(ов) отмечен(ы) как "Отправлен"')
    mark_as_shipped.short_description = '📦 Отправлен'

    def mark_as_delivered(self, request, queryset):
        updated = queryset.update(status='delivered')
        self.message_user(request, f'✅ {updated} заказ(ов) отмечен(ы) как "Доставлен"')
    mark_as_delivered.short_description = '✅ Доставлен'

    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'✅ {updated} заказ(ов) отмечен(ы) как "Отменён"')
    mark_as_cancelled.short_description = '❌ Отменён'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('items')