"""
Формы для заказов.
ВНИМАНИЕ: Этот файл используется только для административной части (admin panel).
Для API используются сериализаторы в serializers.py.
"""

from django import forms
from django.utils.html import strip_tags
from .models import Order


class OrderForm(forms.ModelForm):
    """
    Форма для создания/редактирования заказа в админке
    """
    class Meta:
        model = Order
        fields = [
            'first_name', 'last_name', 'email', 'company',
            'address1', 'address2', 'city', 'country',
            'province', 'postal_code', 'phone', 'special_instructions',
            'status', 'payment_provider'
        ]
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'vTextField'}),
            'last_name': forms.TextInput(attrs={'class': 'vTextField'}),
            'email': forms.EmailInput(attrs={'class': 'vTextField'}),
            'company': forms.TextInput(attrs={'class': 'vTextField'}),
            'address1': forms.TextInput(attrs={'class': 'vTextField'}),
            'address2': forms.TextInput(attrs={'class': 'vTextField'}),
            'city': forms.TextInput(attrs={'class': 'vTextField'}),
            'country': forms.TextInput(attrs={'class': 'vTextField'}),
            'province': forms.TextInput(attrs={'class': 'vTextField'}),
            'postal_code': forms.TextInput(attrs={'class': 'vTextField'}),
            'phone': forms.TextInput(attrs={'class': 'vTextField'}),
            'special_instructions': forms.Textarea(attrs={'rows': 3, 'class': 'vTextField'}),
            'status': forms.Select(attrs={'class': 'vTextField'}),
            'payment_provider': forms.Select(attrs={'class': 'vTextField'}),
        }
    
    def __init__(self, *args, user=None, **kwargs):
        """
        Инициализация формы с возможностью предзаполнения данными пользователя
        """
        super().__init__(*args, **kwargs)
        
        # Если передан пользователь и форма не имеет instance
        if user and not self.instance.pk:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['email'].initial = user.email
            self.fields['phone'].initial = getattr(user, 'phone', '')
            self.fields['address1'].initial = getattr(user, 'address', '')
    
    def clean(self):
        """
        Очистка HTML тегов из текстовых полей
        """
        cleaned_data = super().clean()
        
        # Очищаем HTML теги из всех текстовых полей
        text_fields = ['company', 'address1', 'address2', 'city', 
                       'country', 'province', 'postal_code', 'phone',
                       'special_instructions']
        
        for field in text_fields:
            if cleaned_data.get(field):
                cleaned_data[field] = strip_tags(cleaned_data[field])
        
        return cleaned_data


class OrderStatusForm(forms.ModelForm):
    """
    Форма для быстрого изменения статуса заказа
    """
    class Meta:
        model = Order
        fields = ['status']
        widgets = {
            'status': forms.Select(attrs={'class': 'vTextField'})
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['status'].required = True


class OrderFilterForm(forms.Form):
    """
    Форма для фильтрации заказов в админке
    """
    status = forms.ChoiceField(
        choices=[('', 'All')] + list(Order.STATUS_CHOICES),
        required=False,
        widget=forms.Select(attrs={'class': 'vTextField'})
    )
    payment_provider = forms.ChoiceField(
        choices=[('', 'All'), ('stripe', 'Stripe'), ('heleket', 'Heleket')],
        required=False,
        widget=forms.Select(attrs={'class': 'vTextField'})
    )
    date_from = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'vTextField'})
    )
    date_to = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'vTextField'})
    )
    email = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'class': 'vTextField'})
    )