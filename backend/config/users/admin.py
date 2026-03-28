"""
Настраиваем административный интерфейс Django для кастомной модели пользователя CustomUser.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils.translation import gettext_lazy as _
from .models import CustomUser


class CustomUserChangeForm(UserChangeForm):
    """
    Форма для изменения пользователя в админке
    """
    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = '__all__'


class CustomUserCreationForm(UserCreationForm):
    """
    Форма для создания пользователя в админке
    """
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('email', 'first_name', 'last_name')
    
    def clean_username(self):
        """Убираем валидацию username, если он не используется"""
        # Если в модели нет поля username, возвращаем None
        return None


class CustomUserAdmin(UserAdmin):
    """
    Административный класс для кастомной модели пользователя
    """
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    
    # Отображаемые поля в списке пользователей
    list_display = ('email', 'first_name', 'last_name', 'phone', 
                    'city', 'country', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'country', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name', 'company', 
                     'city', 'country', 'phone')
    ordering = ('-date_joined',)
    
    # Поля, которые можно редактировать прямо в списке
    list_editable = ('is_active', 'is_staff')
    
    # Поля, отображаемые при просмотре детальной информации
    readonly_fields = ('last_login', 'date_joined')
    
    # Настройка полей в форме редактирования
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {
            'fields': (
                'first_name', 'last_name', 'phone', 
                'company', 'address', 'city', 'country', 
                'province', 'postal_code'
            )
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser',
                       'groups', 'user_permissions'),
        }),
        (_('Important dates'), {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    # Настройка полей при создании нового пользователя
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name', 'phone',
                'password1', 'password2', 'is_active', 'is_staff'
            ),
        }),
    )
    
    def get_form(self, request, obj=None, **kwargs):
        """
        Настройка формы для редактирования
        """
        form = super().get_form(request, obj, **kwargs)
        
        # Если поле username существует, делаем его disabled
        if 'username' in form.base_fields:
            form.base_fields['username'].disabled = True
        
        return form
    
    def get_queryset(self, request):
        """
        Оптимизируем запросы
        """
        return super().get_queryset(request).select_related()
    
    actions = ['activate_users', 'deactivate_users']
    
    def activate_users(self, request, queryset):
        """Активировать выбранных пользователей"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} пользователь(ей) активирован(ы)')
    activate_users.short_description = 'Активировать выбранных пользователей'
    
    def deactivate_users(self, request, queryset):
        """Деактивировать выбранных пользователей"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} пользователь(ей) деактивирован(ы)')
    deactivate_users.short_description = 'Деактивировать выбранных пользователей'


# Регистрируем модель в админке
admin.site.register(CustomUser, CustomUserAdmin)