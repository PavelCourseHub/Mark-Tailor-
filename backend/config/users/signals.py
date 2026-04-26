from django.apps import apps
from django.db.models.signals import post_migrate
from django.dispatch import receiver

@receiver(post_migrate)
def setup_custom_reset_form(sender, **kwargs):
    from dj_rest_auth.forms import AllAuthPasswordResetForm
    
    def custom_url_generator(request, user, temp_key):
        return f'http://localhost:3000/password-reset/confirm/{user.pk}/{temp_key}'
    
    AllAuthPasswordResetForm.custom_url_generator = staticmethod(custom_url_generator)