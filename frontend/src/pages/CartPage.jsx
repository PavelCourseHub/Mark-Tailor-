import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

const CartPage = () => {
  const { cart, updateQuantity, removeItem, clearCart, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);
  
  // Состояние для выбранных товаров
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(true);
  
  // Состояния для модальных окон
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemNameToDelete, setItemNameToDelete] = useState('');
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  const formatPrice = (price) => {
    return `${Math.round(price)} BYN`;
  };

  // Инициализация выбора товаров при загрузке корзины
  useEffect(() => {
    if (cart?.items && cart.items.length > 0) {
      const allSelected = {};
      cart.items.forEach(item => {
        allSelected[item.id] = true;
      });
      setSelectedItems(allSelected);
      setSelectAll(true);
    }
  }, [cart]);

  // Подсчёт выбранных товаров
  const getSelectedCount = () => {
    return Object.values(selectedItems).filter(Boolean).length;
  };

  // Получить сумму выбранных товаров
  const getSelectedSubtotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      if (selectedItems[item.id]) {
        return total + item.subtotal;
      }
      return total;
    }, 0);
  };

  // Переключение выбора товара
  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newState = { ...prev, [itemId]: !prev[itemId] };
      const allSelected = cart.items.every(item => newState[item.id]);
      setSelectAll(allSelected);
      return newState;
    });
  };

  // Выбрать все / Снять все
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems({});
      setSelectAll(false);
    } else {
      const allSelected = {};
      cart.items.forEach(item => {
        allSelected[item.id] = true;
      });
      setSelectedItems(allSelected);
      setSelectAll(true);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdating(true);
    await updateQuantity(itemId, newQuantity);
    await fetchCart();
    setUpdating(false);
  };

  // Открыть модальное окно для удаления одного товара
  const handleRemoveItemClick = (itemId, itemName) => {
    setItemToDelete(itemId);
    setItemNameToDelete(itemName);
    setShowDeleteModal(true);
  };

  // Подтверждение удаления одного товара
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      setUpdating(true);
      await removeItem(itemToDelete);
      await fetchCart();
      setSelectedItems(prev => {
        const newState = { ...prev };
        delete newState[itemToDelete];
        return newState;
      });
      setUpdating(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
      setItemNameToDelete('');
    }
  };

  // Открыть модальное окно для очистки всей корзины
  const handleClearCartClick = () => {
    if (cart?.total_items > 0) {
      setShowClearCartModal(true);
    }
  };

  // Подтверждение очистки всей корзины
  const handleConfirmClearCart = async () => {
    setUpdating(true);
    await clearCart();
    setSelectedItems({});
    setSelectAll(true);
    setUpdating(false);
    setShowClearCartModal(false);
  };

  const handleCheckout = () => {
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    
    if (selectedIds.length === 0) {
      // Используем toast через контекст, но пока оставим alert или добавим toast
      alert("Пожалуйста, выберите хотя бы один товар для оформления заказа");
      return;
    }
    
    if (!isAuthenticated) {
      sessionStorage.setItem('pending_checkout_items', JSON.stringify(selectedIds));
      setShowAuthModal(true);
      return;
    }
    
    navigate("/checkout", { state: { selectedItems: selectedIds } });
  };

  const handleAuthConfirm = () => {
    setShowAuthModal(false);
    navigate("/login");
  };

  if (!cart || cart.total_items === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Ваша корзина</h1>
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ваша корзина пуста</h2>
            <p className="text-gray-600 mb-6">Похоже, вы еще не добавили ни одного товара.</p>
            <Link
              to="/catalog"
              className="inline-block px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition"
            >
              Продолжить покупки
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedCount = getSelectedCount();
  const selectedSubtotal = getSelectedSubtotal();

  return (
    <>
      {/* Модальное окно для авторизации */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onConfirm={handleAuthConfirm}
        title="Требуется авторизация"
        message="Пожалуйста, войдите в систему, чтобы оформить заказ."
        confirmText="Войти"
        cancelText="Отмена"
      />

      {/* Модальное окно для удаления одного товара */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Удаление товара"
        message={`Вы уверены, что хотите удалить "${itemNameToDelete}" из корзины?`}
        confirmText="Удалить"
        cancelText="Отмена"
      />

      {/* Модальное окно для очистки всей корзины */}
      <ConfirmModal
        isOpen={showClearCartModal}
        onClose={() => setShowClearCartModal(false)}
        onConfirm={handleConfirmClearCart}
        title="Очистка корзины"
        message="Вы уверены, что хотите удалить все товары из корзины?"
        confirmText="Очистить"
        cancelText="Отмена"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Ваша корзина</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Выбрать все */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll && cart.items.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-black rounded focus:ring-black"
                  />
                  <span className="font-medium text-gray-700">
                    Выбрать все ({cart.items.length} товаров)
                  </span>
                </label>
              </div>

              {cart.items?.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-4 flex flex-wrap gap-4"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems[item.id] || false}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-5 h-5 text-black rounded focus:ring-black"
                    />
                  </div>

                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-2xl">👕</span>
                  </div>

                  <div className="flex-1">
                    <Link to={`/product/${item.product_slug}`} className="font-semibold text-gray-900 hover:text-gray-600">
                      {item.product_name}
                    </Link>
                    <p className="text-sm text-gray-500">Размер: {item.size_name}</p>
                    <p className="text-sm text-gray-500">{formatPrice(item.product_price)} каждый</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={updating}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updating || item.quantity >= item.stock_available}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.subtotal)}
                      </p>
                      <button
                        onClick={() => handleRemoveItemClick(item.id, item.product_name)}
                        disabled={updating}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleClearCartClick}
                disabled={updating}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Очистить корзину
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Сводка заказа</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Выбрано товаров</span>
                    <span>{selectedCount} из {cart.total_items}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Сумма выбранных товаров</span>
                    <span>{formatPrice(selectedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Доставка</span>
                    <span>Рассчитывается при оформлении</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Предполагаемая общая сумма</span>
                      <span>{formatPrice(selectedSubtotal)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={updating || selectedCount === 0}
                  className={`w-full mt-6 py-3 rounded font-semibold transition ${
                    selectedCount === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {selectedCount === 0 
                    ? 'Выберите товары' 
                    : `Оформить заказ (${selectedCount}) • ${formatPrice(selectedSubtotal)}`}
                </button>

                <Link
                  to="/catalog"
                  className="block text-center mt-4 text-sm text-gray-500 hover:text-black"
                >
                  Продолжить покупки
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;