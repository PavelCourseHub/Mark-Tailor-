import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI } from '../api/cart';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data.cart);
      setCartCount(response.data.cart.total_items);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Слушаем событие обновления корзины
  useEffect(() => {
    fetchCart();
    
    const handleCartUpdate = () => {
        console.log('🔄 Cart update event received, refetching cart');
        fetchCart();
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  // Загружаем корзину для всех пользователей (включая неавторизованных)
  useEffect(() => {
    fetchCart();
  }, []);

  // Исправленная функция addToCart
  const addToCart = async (slug, sizeId, quantity) => {
    try {
      const response = await cartAPI.addToCart(slug, { size_id: sizeId, quantity });
      console.log('Add to cart response:', response.data);
      setCart(response.data.cart);
      setCartCount(response.data.total_items);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Add to cart error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to add to cart' 
      };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await cartAPI.updateCartItem(itemId, { quantity });
      setCart(response.data.cart);
      setCartCount(response.data.cart.total_items);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update quantity' 
      };
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await cartAPI.removeCartItem(itemId);
      setCart(response.data.cart);
      setCartCount(response.data.cart.total_items);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to remove item' 
      };
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartAPI.clearCart();
      setCart(response.data.cart);
      setCartCount(0);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to clear cart' 
      };
    }
  };

  const value = {
    cart,
    cartCount,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    fetchCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};