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

  const addToCart = async (slug, sizeId, quantity) => {
    try {
      const response = await cartAPI.addToCart(slug, { size_id: sizeId, quantity });
      setCart(response.data.cart);
      setCartCount(response.data.total_items);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to add to cart' 
      };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const response = await cartAPI.updateItem(itemId, { quantity });
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
      const response = await cartAPI.removeItem(itemId);
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

  useEffect(() => {
    // Загружаем корзину только если есть токен авторизации
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, []);

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