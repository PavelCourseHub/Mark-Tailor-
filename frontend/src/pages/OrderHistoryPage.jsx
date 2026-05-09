import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ordersAPI } from "../api/orders";
import Pagination from '../components/Pagination';
import ConfirmModal from "../components/ConfirmModal";

const STATUS_MAP = {
  pending: { label: "Ожидает оплаты", icon: "⏳", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "В обработке", icon: "🔄", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Отправлен", icon: "📦", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Доставлен", icon: "✅", color: "bg-green-100 text-green-800" },
  completed: { label: "Завершён", icon: "🏁", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Отменён", icon: "❌", color: "bg-red-100 text-red-800" },
  failed: { label: "Ошибка оплаты", icon: "⚠️", color: "bg-orange-100 text-orange-800" },
  refunded: { label: "Возврат", icon: "↩️", color: "bg-pink-100 text-pink-800" },
  waiting_pickup: { label: "Ожидает выдачи", icon: "📍", color: "bg-indigo-100 text-indigo-800" },
  received_paid: { label: "Получен и оплачен", icon: "💰", color: "bg-emerald-100 text-emerald-800" },
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Состояния пагинации
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 10,
    has_next: false,
    has_previous: false,
  });

  // Состояния для модального окна отмены заказа
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [pagination.current_page]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await ordersAPI.getOrders(pagination.current_page, pagination.page_size);
      setOrders(response.data.orders || []);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Ошибка при получении заказов:", err);
      setError("Не удалось загрузить заказы. Пожалуйста, попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current_page: newPage }));
    setExpandedOrder(null);
  };

  // Открыть модальное окно для отмены заказа
  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  // Подтверждение отмены заказа
  const handleConfirmCancel = async () => {
    if (orderToCancel) {
      try {
        await ordersAPI.cancelOrder(orderToCancel.id);
        await fetchOrders();
      } catch (err) {
        alert("Не удалось отменить заказ");
      } finally {
        setShowCancelModal(false);
        setOrderToCancel(null);
      }
    }
  };

  const formatPrice = (price) => {
    return `${Math.round(price)} BYN`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getItemsWord = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) return 'товар';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'товара';
    return 'товаров';
  };

  const getPaymentMethodDisplay = (provider) => {
    if (provider === 'heleket') return 'Оплата при получении';
    if (provider === 'stripe') return 'Банковская карта';
    if (provider === 'cash') return 'Наличными';
    return provider || 'Не указан';
  };

  const toggleOrderExpand = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Загрузка ваших заказов...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Попробуйте еще раз
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">История заказов</h1>
          
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Заказов пока нет</h2>
            <p className="text-gray-600 mb-6">
              Вы еще не оформили ни одного заказа. Начните покупки, чтобы увидеть свои заказы здесь.
            </p>
            <Link
              to="/catalog"
              className="inline-block px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition"
            >
              Начать покупки
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Модальное окно для отмены заказа */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Отмена заказа"
        message={`Вы уверены, что хотите отменить заказ #${orderToCancel?.id}?`}
        confirmText="Отменить заказ"
        cancelText="Оставить"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">История заказов</h1>
          <p className="text-gray-600 mb-6">
            Просматривайте и отслеживайте все свои заказы.
            {pagination.total_items > 0 && (
              <span className="ml-2 text-sm text-gray-400">
                Всего заказов: {pagination.total_items}
              </span>
            )}
          </p>

          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const isExpanded = expandedOrder === order.id;
              
              const firstItems = order.items?.slice(0, 3) || [];
              const remainingCount = (order.items?.length || 0) - 3;
              
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  {/* Order Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-sm text-gray-500 font-medium">
                            Заказ #{order.id}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                            <span>{status.icon}</span> {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(order.created_at)}
                        </p>
                        
                        {/* Названия товаров (превью) */}
                        {firstItems.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            {firstItems.map((item, idx) => (
                              <span key={idx}>
                                {idx > 0 && ', '}
                                <span className="font-medium">{item.product_name}</span>
                                {item.quantity > 1 && ` (${item.quantity} шт.)`}
                              </span>
                            ))}
                            {remainingCount > 0 && (
                              <span className="text-gray-400"> и ещё {remainingCount} {getItemsWord(remainingCount)}</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(order.total_price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items?.length || 0} {getItemsWord(order.items?.length || 0)}
                        </p>
                      </div>
                      
                      <div className="text-gray-400">
                        <svg
                          className={`w-5 h-5 transition-transform ${isExpanded ? "transform rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Order Details (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {/* Order Info */}
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Информация о заказе</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Идентификатор заказа:</span>
                            <span className="ml-2 text-gray-900">#{order.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Дата:</span>
                            <span className="ml-2 text-gray-900">{formatDate(order.created_at)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Оплата:</span>
                            <span className="ml-2 text-gray-900">
                              {getPaymentMethodDisplay(order.payment_provider)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Статус:</span>
                            <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              <span>{status.icon}</span> {status.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {(order.address1 || order.city) && (
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-900 mb-2">Адрес доставки</h3>
                          <div className="text-sm text-gray-700">
                            <p>{order.first_name} {order.last_name}</p>
                            <p>{order.address1}</p>
                            {order.address2 && <p>{order.address2}</p>}
                            <p>{order.city}, {order.postal_code}</p>
                            <p>{order.country}</p>
                            {order.phone && <p className="mt-1">Телефон: {order.phone}</p>}
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Предметы</h3>
                        <div className="space-y-3">
                          {order.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200"
                            >
                              <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-2xl">👕</span>
                              </div>
                              
                              <div className="flex-1">
                                <Link
                                  to={`/product/${item.product_slug || "#"}`}
                                  className="font-medium text-gray-900 hover:text-gray-600 transition"
                                >
                                  {item.product_name}
                                </Link>
                                <div className="text-sm text-gray-500 mt-1">
                                  <span>Размер: {item.size_name}</span>
                                  <span className="mx-2">•</span>
                                  <span>Количество: {item.quantity}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  Цена: {formatPrice(item.price)} каждый
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {formatPrice(item.total_price || item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-end">
                          <div className="text-right">
                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-500">Итого:</span>
                              <span>{formatPrice(order.total_price)}</span>
                            </div>
                            <div className="flex gap-4 text-sm mt-1">
                              <span className="text-gray-500">Доставка:</span>
                              <span>{order.shipping_cost ? formatPrice(order.shipping_cost) : "Бесплатно"}</span>
                            </div>
                            <div className="flex gap-4 text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                              <span>Сумма:</span>
                              <span>{formatPrice(order.total_price)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-3 justify-end">
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleCancelClick(order)}
                            className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition text-sm"
                          >
                            Отменить заказ
                          </button>
                        )}
                        
                        {order.status === "processing" && (
                          <Link
                            to={`/orders/${order.id}/track`}
                            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition text-sm"
                          >
                            Отследить заказ
                          </Link>
                        )}
                        
                        <Link
                          to={`/orders/${order.id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm"
                        >
                          Посмотреть детали
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Пагинация */}
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </>
  );
};

export default OrderHistoryPage;