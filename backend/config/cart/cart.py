from decimal import Decimal
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from main.models import Product, ProductSize


class CartService:
    """
    Сервисный класс для работы с корзиной (обертка над моделью Cart)
    Используется для совместимости со старым кодом и упрощения доступа
    """
    
    def __init__(self, request):
        """
        Инициализация сервиса корзины
        
        Args:
            request: объект HTTP запроса
        """
        self.request = request
        self.cart = self._get_or_create_cart()
    
    def _get_or_create_cart(self):
        """
        Получить или создать корзину для текущего пользователя/сессии
        """
        if self.request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(
                user=self.request.user,
                defaults={'session_key': self.request.session.session_key}
            )
        else:
            if not self.request.session.session_key:
                self.request.session.create()
            
            cart, created = Cart.objects.get_or_create(
                session_key=self.request.session.session_key
            )
        
        # Сохраняем ID корзины в сессии для быстрого доступа
        self.request.session['cart_id'] = cart.id
        self.request.session.modified = True
        
        return cart
    
    def add(self, product, product_size, quantity=1, override_quantity=False):
        """
        Добавить товар в корзину
        
        Args:
            product: объект Product
            product_size: объект ProductSize
            quantity: количество
            override_quantity: если True, заменяет количество, иначе добавляет
        """
        try:
            cart_item = CartItem.objects.get(
                cart=self.cart,
                product=product,
                product_size=product_size
            )
            
            if override_quantity:
                new_quantity = quantity
            else:
                new_quantity = cart_item.quantity + quantity
            
            if new_quantity <= 0:
                cart_item.delete()
                return None
            else:
                cart_item.quantity = new_quantity
                cart_item.save()
                return cart_item
                
        except CartItem.DoesNotExist:
            if quantity > 0:
                cart_item = CartItem.objects.create(
                    cart=self.cart,
                    product=product,
                    product_size=product_size,
                    quantity=quantity
                )
                return cart_item
        
        return None
    
    def remove(self, product, product_size):
        """
        Удалить товар из корзины
        """
        CartItem.objects.filter(
            cart=self.cart,
            product=product,
            product_size=product_size
        ).delete()
    
    def update_quantity(self, product, product_size, quantity):
        """
        Обновить количество товара в корзине
        """
        if quantity <= 0:
            self.remove(product, product_size)
        else:
            self.add(product, product_size, quantity, override_quantity=True)
    
    def get_items(self):
        """
        Получить все товары в корзине
        """
        return self.cart.items.select_related(
            'product', 
            'product_size__size'
        ).order_by('-added_at')
    
    def __iter__(self):
        """
        Итератор по товарам в корзине
        """
        for item in self.get_items():
            yield {
                'product': item.product,
                'product_size': item.product_size,
                'quantity': item.quantity,
                'size': item.product_size.size.name,
                'price': item.product.price,
                'total_price': item.total_price,
                'cart_item_id': item.id,
                'cart_key': f"{item.product.id}_{item.product_size.id}"
            }
    
    def __len__(self):
        """
        Общее количество товаров в корзине
        """
        return self.cart.total_items
    
    def get_total_price(self):
        """
        Получить общую сумму корзины
        """
        return self.cart.subtotal
    
    def clear(self):
        """
        Очистить корзину
        """
        self.cart.clear()
    
    def get_cart_items(self):
        """
        Получить список товаров в корзине в формате словаря
        """
        items = []
        for item in self:
            items.append({
                'product': item['product'],
                'quantity': item['quantity'],
                'size': item['size'],
                'size_id': item['product_size'].id,
                'price': item['price'],
                'total_price': item['total_price'],
                'cart_item_id': item['cart_item_id'],
                'cart_key': item['cart_key']
            })
        return items
    
    def merge_cart(self, session_key):
        """
        Объединить корзину из сессии с текущей корзиной пользователя
        
        Args:
            session_key: ключ сессии для объединения
        """
        try:
            guest_cart = Cart.objects.get(session_key=session_key)
            result = self.cart.merge_with(guest_cart)
            return result
        except Cart.DoesNotExist:
            return None


# Для обратной совместимости со старым кодом
# Создаем псевдоним для CartService как Cart
Cart = CartService