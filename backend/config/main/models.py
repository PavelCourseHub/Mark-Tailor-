from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.core.validators import FileExtensionValidator


class Category(models.Model):
    """
    Модель категории товаров
    """
    name = models.CharField(max_length=100, verbose_name='Название')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='URL')
    description = models.TextField(blank=True, verbose_name='Описание')
    image = models.ImageField(
        upload_to='categories/', 
        blank=True, 
        null=True,
        verbose_name='Изображение'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Родительская категория'
    )

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
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
    slug = models.SlugField(max_length=200, unique=True, verbose_name='URL')
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
    stock = models.PositiveIntegerField(
        default=0,
        verbose_name='Общий остаток',
        help_text='Общее количество товара на складе'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    is_featured = models.BooleanField(default=False, verbose_name='Рекомендуемый')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

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

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_available_stock(self):
        """Получить общий доступный остаток"""
        return self.stock

    def is_in_stock(self):
        """Проверить наличие товара"""
        return self.stock > 0 and self.is_active

    def get_average_rating(self):
        """Получить средний рейтинг товара"""
        # Здесь можно добавить логику рейтинга
        return 0


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


class ProductReview(models.Model):
    """
    Отзывы на товары (добавлено для полноты функционала)
    """
    RATING_CHOICES = [
        (1, '1 - Ужасно'),
        (2, '2 - Плохо'),
        (3, '3 - Нормально'),
        (4, '4 - Хорошо'),
        (5, '5 - Отлично'),
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
    rating = models.PositiveSmallIntegerField(
        choices=RATING_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='Оценка'
    )
    comment = models.TextField(blank=True, verbose_name='Комментарий')
    is_approved = models.BooleanField(default=False, verbose_name='Одобрен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at']
        unique_together = ['product', 'user']

    def __str__(self):
        return f"Review by {self.user.username} for {self.product.name} - {self.rating} stars"


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