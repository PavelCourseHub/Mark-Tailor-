"""
Контекстный процессор для передачи информации о корзине во все шаблоны.
ВНИМАНИЕ: Этот файл используется только если вы все еще используете шаблоны Django.
Если вы полностью перешли на React + DRF, этот файл можно удалить.
"""

from .models import Cart


def cart_processor(request):
    """
    Добавляет информацию о корзине в контекст всех шаблонов.
    
    Returns:
        dict: Словарь с данными корзины
    """
    # Если запрос не имеет сессии, создаем ее
    if not request.session.session_key:
        request.session.create()
    
    # Получаем или создаем корзину
    if request.user.is_authenticated:
        # Для авторизованных пользователей - корзина привязана к пользователю
        cart, created = Cart.objects.get_or_create(
            user=request.user,
            defaults={'session_key': request.session.session_key}
        )
    else:
        # Для неавторизованных - корзина привязана к сессии
        cart, created = Cart.objects.get_or_create(
            session_key=request.session.session_key
        )
    
    # Сохраняем ID корзины в сессии для оптимизации
    request.session['cart_id'] = cart.id
    request.session.modified = True
    
    return {
        'cart_total_items': cart.total_items,
        'cart_subtotal': cart.subtotal,
        'cart': cart,  # Добавляем объект корзины целиком
        'cart_items': cart.items.select_related('product', 'product_size__size').order_by('-added_at'),
    }