from django.utils.deprecation import MiddlewareMixin
from .models import Cart


class CartMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # SessionMiddleware уже должен быть вызван, поэтому session существует
        if not request.session.session_key:
            request.session.create()
            request.session.save()
        
        # Получаем или создаём корзину для этой сессии
        cart, created = Cart.objects.get_or_create(
            session_key=request.session.session_key
        )
        request.cart = cart
        
        # Сохраняем ID корзины в сессии
        request.session['cart_id'] = cart.id
        request.session.modified = True
        
        print(f"🛒 CartMiddleware: session_key={request.session.session_key}, cart_id={cart.id}, created={created}")
        return None