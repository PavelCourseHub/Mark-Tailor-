from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.utils.html import strip_tags

from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.template.loader import render_to_string

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
    
class CustomPasswordResetForm(PasswordResetForm):
    """
    Кастомная форма для сброса пароля с ссылкой на React фронтенд
    """
    def send_mail(self, subject_template_name, email_template_name,
                  context, from_email, to_email, html_email_template_name=None):
        
        print("=" * 50)
        print("Sending password reset email")
        print(f"To: {to_email}")
        print(f"User: {context.get('user')}")
        print("=" * 50)
        
        """
        Переопределяем отправку письма с нашей ссылкой
        """
        # Получаем пользователя из контекста
        user = context['user']
        
        # Генерируем uid и token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Создаём ссылку на React фронтенд
        reset_link = f'http://localhost:3000/password-reset/confirm/{uid}/{token}/'
        
        # Обновляем контекст с нашей ссылкой
        context['reset_link'] = reset_link
        context['site_name'] = 'Mark Tailor'
        
        # Формируем письмо
        subject = render_to_string(subject_template_name, context)
        subject = ''.join(subject.splitlines())
        email_message = render_to_string(email_template_name, context)
        
        # Отправляем письмо
        send_mail(subject, email_message, from_email, [to_email])