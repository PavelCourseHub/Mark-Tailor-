"""
Пользовательская модель пользователя Django с расширенными полями и кастомным менеджером
"""

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.html import strip_tags
from django.core.validators import RegexValidator


class CustomUserManager(BaseUserManager):
    """
    Кастомный менеджер пользователей, использующий email вместо username
    """
    
    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        """
        Создание обычного пользователя
        """
        if not email:
            raise ValueError("The Email field must be set.")
        
        email = self.normalize_email(email)
        
        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            **extra_fields
        )
        
        user.set_password(password)
        user.save(using=self._db)
        
        return user

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        """
        Создание суперпользователя
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, first_name, last_name, password, **extra_fields)


class CustomUser(AbstractUser):
    """
    Кастомная модель пользователя с email в качестве основного идентификатора
    """
    # Убираем поле username, так как используем email
    username = None
    
    # Основные поля
    email = models.EmailField(
        unique=True, 
        max_length=254,
        verbose_name='Email'
    )
    first_name = models.CharField(
        max_length=50,
        verbose_name='Имя'
    )
    last_name = models.CharField(
        max_length=50,
        verbose_name='Фамилия'
    )
    
    # Контактная информация
    phone = models.CharField(
        max_length=20,
        unique=True,
        null=True, 
        blank=True,
        validators=[RegexValidator(
            r'^\+?375?\d{9,15}$',
            "Enter a valid phone number (e.g., +375291234567)"
        )],
        verbose_name='Телефон'
    )
    
    # Адресная информация
    company = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name='Компания'
    )
    address = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        verbose_name='Адрес'
    )
    address1 = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        verbose_name='Адрес 1'
    )
    address2 = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        verbose_name='Адрес 2'
    )
    city = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name='Город'
    )
    country = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name='Страна'
    )
    province = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name='Регион'
    )
    postal_code = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name='Почтовый индекс'
    )
    
    # Менеджер объектов
    objects = CustomUserManager()
    
    # Настройки аутентификации
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
        ]

    def __str__(self):
        return self.email

    def get_full_name(self):
        """
        Возвращает полное имя пользователя
        """
        return f"{self.first_name} {self.last_name}".strip()

    def clean(self):
        """
        Очистка HTML тегов из текстовых полей
        """
        super().clean()
        
        # Список полей для очистки от HTML тегов
        text_fields = [
            'company', 'address', 'address1', 'address2', 'city',
            'country', 'province', 'postal_code', 'phone'
        ]
        
        for field in text_fields:
            value = getattr(self, field)
            if value:
                cleaned_value = strip_tags(value)
                setattr(self, field, cleaned_value)
    
    def save(self, *args, **kwargs):
        """
        Переопределяем save для автоматической очистки данных
        """
        self.full_clean()  # Вызываем валидацию перед сохранением
        super().save(*args, **kwargs)