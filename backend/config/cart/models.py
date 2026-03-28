from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from main.models import Product, ProductSize
from decimal import Decimal


class Cart(models.Model):
    """
    Модель корзины покупок
    
    Поддерживает:
    - Анонимные корзины через session_key
    - Авторизованные корзины через user
    - Объединение корзин после авторизации
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='carts',
        verbose_name='Пользователь'
    )
    session_key = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        verbose_name='Ключ сессии'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_key']),
            models.Index(fields=['-created_at']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(user__isnull=False) | 
                    models.Q(session_key__isnull=False)
                ),
                name='cart_has_user_or_session'
            )
        ]

    def __str__(self):
        if self.user:
            return f"Cart #{self.id} - User: {self.user.email}"
        return f"Cart #{self.id} - Session: {self.session_key}"

    @property
    def total_items(self):
        """Общее количество товаров в корзине"""
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        """Сумма всех товаров в корзине (без учета доставки и налогов)"""
        return sum(item.total_price for item in self.items.all())

    def add_product(self, product, product_size, quantity=1):
        """
        Добавить товар в корзину
        
        Args:
            product: объект Product
            product_size: объект ProductSize
            quantity: количество (по умолчанию 1)
        
        Returns:
            CartItem: созданный или обновленный объект CartItem
        """
        # Проверяем наличие на складе
        if product_size.stock < quantity:
            raise ValueError(f"Not enough stock. Available: {product_size.stock}")
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=self,
            product=product,
            product_size=product_size,
            defaults={'quantity': quantity}
        )
        
        if not created:
            new_quantity = cart_item.quantity + quantity
            if new_quantity > product_size.stock:
                raise ValueError(
                    f"Cannot add {quantity} items. "
                    f"Only {product_size.stock - cart_item.quantity} more available."
                )
            cart_item.quantity = new_quantity
            cart_item.save()
        
        return cart_item

    def remove_item(self, item_id):
        """
        Удалить товар из корзины
        
        Args:
            item_id: ID CartItem
        
        Returns:
            bool: True если удалено, False если товар не найден
        """
        try:
            item = self.items.get(id=item_id)
            item.delete()
            return True
        except CartItem.DoesNotExist:
            return False

    def update_item_quantity(self, item_id, quantity):
        """
        Обновить количество товара в корзине
        
        Args:
            item_id: ID CartItem
            quantity: новое количество (если 0, товар удаляется)
        
        Returns:
            bool: True если обновлено, False если товар не найден
        """
        try:
            item = self.items.get(id=item_id)
            
            if quantity <= 0:
                item.delete()
                return True
            
            # Проверяем наличие на складе
            if quantity > item.product_size.stock:
                raise ValueError(f"Not enough stock. Available: {item.product_size.stock}")
            
            item.quantity = quantity
            item.save()
            return True
            
        except CartItem.DoesNotExist:
            return False

    def clear(self):
        """Полностью очистить корзину"""
        self.items.all().delete()

    def merge_with(self, other_cart):
        """
        Объединить текущую корзину с другой корзиной
        
        Args:
            other_cart: другой объект Cart для объединения
        
        Returns:
            dict: статистика объединения
        """
        merged_items = 0
        updated_items = 0
        
        for item in other_cart.items.all():
            existing_item = self.items.filter(
                product=item.product,
                product_size=item.product_size
            ).first()
            
            if existing_item:
                # Обновляем количество существующего товара
                existing_item.quantity += item.quantity
                existing_item.save()
                updated_items += 1
            else:
                # Переносим товар в текущую корзину
                item.cart = self
                item.save()
                merged_items += 1
        
        # Удаляем старую корзину
        other_cart.delete()
        
        return {
            'merged_items': merged_items,
            'updated_items': updated_items,
            'total_items': self.total_items
        }

    def is_empty(self):
        """Проверить, пуста ли корзина"""
        return self.total_items == 0


class CartItem(models.Model):
    """
    Модель товара в корзине
    """
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Корзина'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='Товар'
    )
    product_size = models.ForeignKey(
        ProductSize,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='Размер'
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Количество'
    )
    added_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Товар в корзине'
        verbose_name_plural = 'Товары в корзине'
        ordering = ['-added_at']
        unique_together = ['cart', 'product', 'product_size']
        indexes = [
            models.Index(fields=['cart', 'product']),
            models.Index(fields=['-added_at']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.product_size.size.name} x {self.quantity}"

    @property
    def total_price(self):
        """
        Общая стоимость товара с учетом количества
        
        Returns:
            Decimal: цена * количество
        """
        return Decimal(str(self.product.price)) * self.quantity

    def save(self, *args, **kwargs):
        """
        Переопределяем save для дополнительной валидации
        """
        # Проверяем, что количество не превышает остаток на складе
        if self.quantity > self.product_size.stock:
            raise ValueError(
                f"Not enough stock. Available: {self.product_size.stock}"
            )
        
        super().save(*args, **kwargs)


class CartHistory(models.Model):
    """
    История изменений корзины (для аналитики)
    """
    ACTION_CHOICES = [
        ('ADD', 'Add Item'),
        ('UPDATE', 'Update Quantity'),
        ('REMOVE', 'Remove Item'),
        ('CLEAR', 'Clear Cart'),
        ('MERGE', 'Merge Cart'),
    ]
    
    cart = models.ForeignKey(
        Cart,
        on_delete=models.SET_NULL,
        null=True,
        related_name='history',
        verbose_name='Корзина'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cart_history',
        verbose_name='Пользователь'
    )
    action = models.CharField(
        max_length=10,
        choices=ACTION_CHOICES,
        verbose_name='Действие'
    )
    product_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Название товара'
    )
    quantity = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Количество'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Цена'
    )
    session_key = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        verbose_name='Ключ сессии'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата и время'
    )
    
    class Meta:
        verbose_name = 'История корзины'
        verbose_name_plural = 'История корзин'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['cart', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['session_key', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} - {self.created_at}"