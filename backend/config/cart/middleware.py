# Обеспечивает наличие объекта корзины (request.cart) для каждого запроса
# Гарантирует, что у каждого пользователя (даже анонимного) есть корзина

from django.utils.deprecation import MiddlewareMixin
from .models import Cart


class CartMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if not request.session.session_key:
            request.session.create()

        request.cart, created = Cart.objects.get_or_create(
            session_key=request.session.session_key
        )
        return None