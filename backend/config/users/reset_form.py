from dj_rest_auth.forms import AllAuthPasswordResetForm

def custom_url_generator(request, user, temp_key):
    # Генерируем ссылку на React фронтенд
    return f'http://localhost:3000/password-reset/confirm/{user.pk}/{temp_key}'

# Применяем кастомный генератор
AllAuthPasswordResetForm.custom_url_generator = staticmethod(custom_url_generator)