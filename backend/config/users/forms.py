"""
Формы для пользователей.
ВНИМАНИЕ: Этот файл используется только для административной части (admin panel).
Для API используются сериализаторы в serializers.py.
"""

from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.utils.html import strip_tags

User = get_user_model()


class CustomUserCreationForm(UserCreationForm):
    """
    Форма для создания пользователя в админке
    """
    email = forms.EmailField(
        required=True,
        max_length=254,
        widget=forms.EmailInput(attrs={'class': 'vTextField'})
    )
    first_name = forms.CharField(
        required=True,
        max_length=50,
        widget=forms.TextInput(attrs={'class': 'vTextField'})
    )
    last_name = forms.CharField(
        required=True,
        max_length=50,
        widget=forms.TextInput(attrs={'class': 'vTextField'})
    )
    phone = forms.CharField(
        required=False,
        validators=[RegexValidator(r'^\+?375?\d{9,15}$', "Enter a valid phone number.")],
        widget=forms.TextInput(attrs={'class': 'vTextField'})
    )

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'phone', 'password1', 'password2')

    def clean_email(self):
        """Проверка уникальности email"""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('This email is already in use.')
        return email

    def save(self, commit=True):
        """Сохранение пользователя"""
        user = super().save(commit=False)
        user.is_active = True  # Для админки создаем активного пользователя
        if commit:
            user.save()
        return user


class CustomUserChangeForm(UserChangeForm):
    """
    Форма для изменения пользователя в админке
    """
    phone = forms.CharField(
        required=False,
        validators=[RegexValidator(r'^\+?375?\d{9,15}$', "Enter a valid phone number.")],
        widget=forms.TextInput(attrs={'class': 'vTextField'})
    )

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'company', 
                  'address1', 'address2', 'city', 'country',  # Используем address1, address2
                  'province', 'postal_code', 'phone')

    def clean_email(self):
        """Проверка уникальности email при изменении"""
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email=email).exclude(id=self.instance.id).exists():
            raise forms.ValidationError('This email is already in use.')
        return email

    def clean(self):
        """Очистка HTML тегов из текстовых полей"""
        cleaned_data = super().clean()
        
        # Очищаем текстовые поля от HTML тегов
        text_fields = ['company', 'address1', 'address2', 'city', 
                       'country', 'province', 'postal_code', 'phone']
        
        for field in text_fields:
            if cleaned_data.get(field):
                cleaned_data[field] = strip_tags(cleaned_data[field])
        
        return cleaned_data


# Следующие формы оставлены для обратной совместимости,
# но в DRF они не используются
class CustomUserLoginForm(forms.Form):
    """
    Форма для входа (не используется в DRF, оставлена для совместимости)
    """
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'vTextField'})
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'vTextField'})
    )

    def clean(self):
        email = self.cleaned_data.get('email')
        password = self.cleaned_data.get('password')
        
        if email and password:
            from django.contrib.auth import authenticate
            self.user_cache = authenticate(
                self.request, 
                username=email, 
                password=password
            )
            
            if self.user_cache is None:
                raise forms.ValidationError('Invalid email or password.')
            elif not self.user_cache.is_active:
                raise forms.ValidationError('This account is inactive.')
        
        return self.cleaned_data

    def get_user(self):
        return self.user_cache


class CustomUserUpdateForm(forms.ModelForm):
    """
    Форма для обновления профиля (не используется в DRF, оставлена для совместимости)
    """
    phone = forms.CharField(
        required=False,
        validators=[RegexValidator(r'^\+?375?\d{9,15}$', "Enter a valid phone number.")],
        widget=forms.TextInput(attrs={'class': 'vTextField'})
    )
    first_name = forms.CharField(
        required=True,
        max_length=50,
        widget=forms.TextInput(attrs={'class': 'vTextField'})
    )
    last_name = forms.CharField(
        required=True,
        max_length=50,
        widget=forms.TextInput(attrs={'class': 'vTextField'})
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={'class': 'vTextField'})
    )

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'company', 
                  'address1', 'address2', 'city', 'country',
                  'province', 'postal_code', 'phone')
        widgets = {
            'company': forms.TextInput(attrs={'class': 'vTextField'}),
            'address1': forms.TextInput(attrs={'class': 'vTextField'}),
            'address2': forms.TextInput(attrs={'class': 'vTextField'}),
            'city': forms.TextInput(attrs={'class': 'vTextField'}),
            'country': forms.TextInput(attrs={'class': 'vTextField'}),
            'province': forms.TextInput(attrs={'class': 'vTextField'}),
            'postal_code': forms.TextInput(attrs={'class': 'vTextField'}),
        }

    def clean_email(self):
        """Проверка уникальности email при обновлении"""
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email=email).exclude(id=self.instance.id).exists():
            raise forms.ValidationError('This email is already in use.')
        return email

    def clean(self):
        """Очистка HTML тегов из текстовых полей"""
        cleaned_data = super().clean()
        
        text_fields = ['company', 'address1', 'address2', 'city', 
                       'country', 'province', 'postal_code', 'phone']
        
        for field in text_fields:
            if cleaned_data.get(field):
                cleaned_data[field] = strip_tags(cleaned_data[field])
        
        return cleaned_data