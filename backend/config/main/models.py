from django.db import models
from django.utils.text import slugify
import uuid
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.core.validators import FileExtensionValidator


class Category(models.Model):
    """
    Модель категории товаров
    """
    name = models.CharField(max_length=100, verbose_name='Название')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='URL', blank=True)
    description = models.TextField(blank=True, verbose_name='Описание')
    image = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name='Изображение'
    )
    image_2 = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name='Изображение 2'
    )
    image_3 = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name='Изображение 3'
    )
    image_4 = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name='Изображение 4'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Родительская категория'
    )
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок отображения')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        if self.order == 0:
            max_order = Category.objects.aggregate(max_order=models.Max('order'))['max_order']
            self.order = (max_order or 0) + 1
        super().save(*args, **kwargs)

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} → {self.name}"
        return self.name


class Size(models.Model):
    """
    Модель размеров товаров
    """
    name = models.CharField(max_length=20, verbose_name='Название размера')
    value = models.CharField(max_length=10, blank=True, verbose_name='Значение')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')

    class Meta:
        verbose_name = 'Размер'
        verbose_name_plural = 'Размеры'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Модель товара
    """
    name = models.CharField(max_length=200, verbose_name='Название')
    slug = models.SlugField(max_length=200, unique=True, verbose_name='URL', blank=True)
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE,
        related_name='products',
        verbose_name='Категория'
    )
    color = models.CharField(max_length=100, blank=True, verbose_name='Цвет')
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Цена'
    )
    description = models.TextField(blank=True, verbose_name='Описание')
    main_image = models.ImageField(
        upload_to='products/main/',
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'webp']
            )
        ],
        verbose_name='Главное изображение'
    )
    image_2 = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name='Изображение 2'
    )
    image_3 = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name='Изображение 3'
    )
    image_4 = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name='Изображение 4'
    )
    stock = models.PositiveIntegerField(
        default=0,
        verbose_name='Общий остаток',
        help_text='Общее количество товара на складе'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    is_featured = models.BooleanField(default=False, verbose_name='Рекомендуемый')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    # Поля для скидок
    discount_percent = models.PositiveIntegerField(
        default=0,
        verbose_name='Скидка (%)',
        help_text='Процент скидки на товар (0-100)'
    )
    is_on_sale = models.BooleanField(
        default=False,
        verbose_name='Участвует в распродаже'
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Цена со скидкой',
        help_text='Автоматически рассчитывается из цены и процента скидки'
    )
    
    def calculate_sale_price(self):
        """Рассчитать цену со скидкой"""
        if self.discount_percent > 0:
            discount = Decimal(self.discount_percent) / Decimal(100)
            return self.price * (Decimal(1) - discount)
        return self.price
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        self.sale_price = self.calculate_sale_price()
        self.is_on_sale = self.discount_percent > 0
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

    def get_available_stock(self):
        return self.stock

    def is_in_stock(self):
        return self.stock > 0 and self.is_active

    def get_average_rating(self):
        from .models import Review
        result = self.reviews.filter(is_approved=True).aggregate(avg=models.Avg('rating'))
        return result['avg'] or 0

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['price']),
            models.Index(fields=['created_at']),
        ]


class ProductSize(models.Model):
    """
    Связь товара с размерами (количество на размер)
    """
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE,
        related_name='product_sizes',
        verbose_name='Товар'
    )
    size = models.ForeignKey(
        Size, 
        on_delete=models.CASCADE,
        related_name='product_sizes',
        verbose_name='Размер'
    )
    stock = models.PositiveIntegerField(default=0, verbose_name='Остаток')

    class Meta:
        verbose_name = 'Размер товара'
        verbose_name_plural = 'Размеры товаров'
        unique_together = ['product', 'size']
        indexes = [
            models.Index(fields=['product', 'size']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.size.name} ({self.stock} in stock)"


class ProductImage(models.Model):
    """
    Дополнительные изображения товара
    """
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Товар'
    )
    image = models.ImageField(
        upload_to='products/extra/',
        verbose_name='Изображение'
    )
    alt_text = models.CharField(
        max_length=200, 
        blank=True, 
        verbose_name='Альтернативный текст'
    )
    sort_order = models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Изображение товара'
        verbose_name_plural = 'Изображения товаров'
        ordering = ['sort_order', 'created_at']

    def __str__(self):
        return f"Image for {self.product.name}"


class Review(models.Model):
    """
    Отзывы на товары
    """
    RATING_CHOICES = [
        (1, '1 ★ - Ужасно'),
        (2, '2 ★ - Плохо'),
        (3, '3 ★ - Нормально'),
        (4, '4 ★ - Хорошо'),
        (5, '5 ★ - Отлично'),
    ]
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Товар'
    )
    user = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Пользователь'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reviews',
        verbose_name='Заказ'
    )
    rating = models.PositiveSmallIntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Оценка'
    )
    comment = models.TextField(max_length=1000, verbose_name='Комментарий')
    image = models.ImageField(
        upload_to='reviews/',
        null=True,
        blank=True,
        verbose_name='Фото'
    )
    is_verified_purchase = models.BooleanField(
        default=False,
        verbose_name='Подтверждённая покупка'
    )
    is_approved = models.BooleanField(
        default=False,
        verbose_name='Одобрен'
    )
    helpful_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Полезные голоса'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at']
        unique_together = ['product', 'user']
        indexes = [
            models.Index(fields=['product', 'is_approved']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Отзыв от {self.user.email} на {self.product.name} - {self.rating}★"


class Coupon(models.Model):
    """
    Промокоды и купоны
    """
    DISCOUNT_TYPE_CHOICES = [
        ('percent', 'Процент (%)'),
        ('fixed', 'Фиксированная сумма (BYN)'),
    ]
    
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name='Код промокода'
    )
    discount_type = models.CharField(
        max_length=10,
        choices=DISCOUNT_TYPE_CHOICES,
        default='percent',
        verbose_name='Тип скидки'
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Значение скидки'
    )
    
    min_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Минимальная сумма заказа'
    )
    max_discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Максимальная сумма скидки'
    )
    
    usage_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Лимит использований (всего)'
    )
    per_user_limit = models.PositiveIntegerField(
        default=1,
        verbose_name='Лимит на пользователя'
    )
    used_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Количество использований'
    )
    
    applicable_categories = models.ManyToManyField(
        Category,
        blank=True,
        verbose_name='Применяется к категориям'
    )
    applicable_products = models.ManyToManyField(
        Product,
        blank=True,
        verbose_name='Применяется к товарам'
    )
    
    valid_from = models.DateTimeField(verbose_name='Действует с')
    valid_to = models.DateTimeField(verbose_name='Действует до')
    
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    
    created_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_coupons',
        verbose_name='Создал'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        verbose_name = 'Промокод'
        verbose_name_plural = 'Промокоды'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.discount_value}{'%' if self.discount_type == 'percent' else ' BYN'}"
    
    def is_valid(self, user=None, cart_total=0):
        from django.utils import timezone
        
        if not self.is_active:
            return False, "Промокод не активен"
        
        now = timezone.now()
        if now < self.valid_from:
            return False, "Промокод ещё не активен"
        if now > self.valid_to:
            return False, "Промокод истёк"
        
        if self.usage_limit and self.used_count >= self.usage_limit:
            return False, "Промокод больше недоступен"
        
        if cart_total < self.min_order_amount:
            return False, f"Минимальная сумма заказа для этого промокода: {self.min_order_amount} BYN"
        
        return True, "OK"
    
    def calculate_discount(self, cart_total):
        if self.discount_type == 'percent':
            discount = cart_total * self.discount_value / 100
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
        else:
            discount = min(self.discount_value, cart_total)
        return discount


class Wishlist(models.Model):
    """
    Список желаний пользователя
    """
    user = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='wishlist',
        verbose_name='Пользователь'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='wishlisted_by',
        verbose_name='Товар'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')

    class Meta:
        verbose_name = 'Список желаний'
        verbose_name_plural = 'Списки желаний'
        unique_together = ['user', 'product']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"
    

class Subscriber(models.Model):
    """
    Модель для подписчиков рассылки
    """
    email = models.EmailField(unique=True, verbose_name='Email')
    subscribed_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата подписки')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    
    class Meta:
        verbose_name = 'Подписчик'
        verbose_name_plural = 'Подписчики'
        ordering = ['-subscribed_at']
    
    def __str__(self):
        return self.email