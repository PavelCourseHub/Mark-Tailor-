from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
from main.models import Product, ProductSize


class Order(models.Model):
    """
    Модель заказа
    """
    STATUS_CHOICES = (
        ('pending', 'Ожидает оплаты'),
        ('processing', 'В обработке'),
        ('shipped', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('completed', 'Завершён'),
        ('cancelled', 'Отменён'),
        ('failed', 'Ошибка оплаты'),
        ('refunded', 'Возврат'),
        ('waiting_pickup', 'Ожидает выдачи'),
        ('received_paid', 'Получен и оплачен'),
    )
    
    PAYMENT_PROVIDER_CHOICES = (
        ('stripe', 'Stripe'),
        ('heleket', 'Heleket'),
        ('cash', 'Наличные'),
        ('card', 'Картой'),
    )

    # Основная информация
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Пользователь'
    )
    
    # Контактная информация
    first_name = models.CharField(max_length=50, verbose_name='Имя')
    last_name = models.CharField(max_length=50, verbose_name='Фамилия')
    email = models.EmailField(max_length=254, verbose_name='Email')
    
    # Адрес доставки
    company = models.CharField(max_length=100, blank=True, null=True, verbose_name='Компания')
    address1 = models.CharField(max_length=250, blank=True, null=True, verbose_name='Адрес 1')
    address2 = models.CharField(max_length=250, blank=True, null=True, verbose_name='Адрес 2')
    city = models.CharField(max_length=100, blank=True, null=True, verbose_name='Город')
    country = models.CharField(max_length=100, blank=True, null=True, verbose_name='Страна')
    province = models.CharField(max_length=100, blank=True, null=True, verbose_name='Регион')
    postal_code = models.CharField(max_length=20, blank=True, null=True, verbose_name='Почтовый индекс')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    
    # Дополнительная информация
    special_instructions = models.TextField(blank=True, verbose_name='Особые указания')
    
    # Финансовая информация
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Общая сумма'
    )
    
    # Статусы
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    
    # Платежная информация
    payment_provider = models.CharField(
        max_length=20,
        choices=PAYMENT_PROVIDER_CHOICES,
        null=True,
        blank=True,
        verbose_name='Платежный провайдер'
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Stripe Payment Intent ID'
    )
    heleket_payment_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Heleket Payment ID'
    )
    
    # Отслеживание
    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Трек-номер'
    )
    notes = models.TextField(blank=True, verbose_name='Заметки')
    
    # Временные метки
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Order #{self.id} - {self.email}"

    @property
    def full_name(self):
        """Полное имя заказчика"""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def full_address(self):
        """Полный адрес доставки"""
        address_parts = []
        
        if self.address1:
            address_parts.append(self.address1)
        if self.address2:
            address_parts.append(self.address2)
        if self.city:
            address_parts.append(self.city)
        if self.province:
            address_parts.append(self.province)
        if self.postal_code:
            address_parts.append(self.postal_code)
        if self.country:
            address_parts.append(self.country)
        
        return ", ".join(address_parts)

    @property
    def total_items(self):
        """Общее количество товаров в заказе"""
        return sum(item.quantity for item in self.items.all())

    def get_status_display_custom(self):
        """Получить отображаемое название статуса"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    def is_paid(self):
        """Проверить, оплачен ли заказ"""
        return self.status in ['processing', 'shipped', 'delivered']

    def can_cancel(self):
        """Можно ли отменить заказ"""
        return self.status in ['pending', 'failed']

    def can_update_status(self, new_status):
        """Проверить, можно ли изменить статус"""
        valid_transitions = {
            'pending': ['processing', 'cancelled', 'failed'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': [],
            'failed': ['pending', 'cancelled'],
        }
        return new_status in valid_transitions.get(self.status, [])

    def update_status(self, new_status):
        """Обновить статус заказа с проверкой"""
        if self.can_update_status(new_status):
            self.status = new_status
            self.save()
            return True
        return False


class OrderItem(models.Model):
    """
    Модель товара в заказе
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Заказ'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name='Товар'
    )
    size = models.ForeignKey(
        ProductSize,
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name='Размер'
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Количество'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Цена'
    )
    
    # Для истории
    product_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Название товара (на момент заказа)'
    )
    size_name = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Размер (на момент заказа)'
    )
    
    # Временная метка
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')

    class Meta:
        verbose_name = 'Товар в заказе'
        verbose_name_plural = 'Товары в заказе'
        ordering = ['id']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f"{self.product_name or self.product.name} - {self.size_name or self.size.size.name} x {self.quantity}"

    @property
    def total_price(self):
        """Общая стоимость товара с учетом количества"""
        return self.price * self.quantity

    def save(self, *args, **kwargs):
        """Сохраняем названия товара и размера для истории"""
        if not self.product_name and self.product:
            self.product_name = self.product.name
        if not self.size_name and self.size and self.size.size:
            self.size_name = self.size.size.name
        super().save(*args, **kwargs)


class OrderHistory(models.Model):
    """
    История изменений статуса заказа
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='Заказ'
    )
    status = models.CharField(
        max_length=20,
        choices=Order.STATUS_CHOICES,
        verbose_name='Статус'
    )
    note = models.TextField(blank=True, verbose_name='Примечание')
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_status_changes',
        verbose_name='Кто изменил'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата изменения')

    class Meta:
        verbose_name = 'История заказа'
        verbose_name_plural = 'Истории заказов'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'created_at']),
        ]

    def __str__(self):
        return f"Order #{self.order.id} - {self.status} at {self.created_at}"