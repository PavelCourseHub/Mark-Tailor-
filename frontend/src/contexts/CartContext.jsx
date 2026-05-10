import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI } from '../api/cart';
import Toast from '../components/Toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

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

  useEffect(() => {
    fetchCart();
    
    const handleCartUpdate = () => {
        console.log('🔄 Cart update event received, refetching cart');
        fetchCart();
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (slug, sizeId, quantity) => {
    try {
      const response = await cartAPI.addToCart(slug, { size_id: sizeId, quantity });
      setCart(response.data.cart);
      setCartCount(response.data.total_items);
      
      showToast('Товар успешно добавлен в корзину!', 'success');
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Не удалось добавить товар в корзину';
      showToast(errorMessage, 'error');
      return { 
        success: false, 
        error: errorMessage
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
      showToast('Товар удалён из корзины', 'success');
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
      showToast('Корзина очищена', 'success');
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
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </CartContext.Provider>
  );
};