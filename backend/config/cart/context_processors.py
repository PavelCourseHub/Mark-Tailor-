# Проверяет, существует ли ключ сессии у текущего пользователя
# Если нет (например, новый посетитель), создает новую сессию

from .models import Cart


def cart_processor(request):
    if not request.session.session_key:
        request.session.create()

    cart, created = Cart.objects.get_or_create(
        session_key = request.session.session_key
    )

    return {
        'cart_total_items': cart.total_items,
        'cart_subtotal': cart.subtotal,
    }