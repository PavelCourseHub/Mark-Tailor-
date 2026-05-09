import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ordersAPI } from "../api/orders";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_MAP = {
  pending: { label: "Ожидает оплаты", icon: "⏳", color: "bg-yellow-100 text-yellow-800", step: 1 },
  processing: { label: "В обработке", icon: "🔄", color: "bg-blue-100 text-blue-800", step: 2 },
  shipped: { label: "Отправлен", icon: "📦", color: "bg-purple-100 text-purple-800", step: 3 },
  delivered: { label: "Доставлен", icon: "✅", color: "bg-green-100 text-green-800", step: 4 },
  completed: { label: "Завершён", icon: "🏁", color: "bg-green-100 text-green-800", step: 5 },
  cancelled: { label: "Отменён", icon: "❌", color: "bg-red-100 text-red-800", step: 0 },
  failed: { label: "Ошибка оплаты", icon: "⚠️", color: "bg-orange-100 text-orange-800", step: 0 },
  refunded: { label: "Возврат", icon: "↩️", color: "bg-pink-100 text-pink-800", step: 0 },
  waiting_pickup: { label: "Ожидает выдачи", icon: "📍", color: "bg-indigo-100 text-indigo-800", step: 3 },
  received_paid: { label: "Получен и оплачен", icon: "💰", color: "bg-emerald-100 text-emerald-800", step: 5 },
};

const ORDER_STEPS = [
  { key: "pending", label: "Заказ оформлен", icon: "📝" },
  { key: "processing", label: "В обработке", icon: "🔄" },
  { key: "shipped", label: "Отправлен", icon: "📦" },
  { key: "delivered", label: "Доставлен", icon: "✅" },
  { key: "completed", label: "Завершён", icon: "🏁" },
];

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  
  // Состояние для модального окна отмены заказа
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await ordersAPI.getOrderDetail(orderId);
      setOrder(response.data);
      if (response.data.items && response.data.items.length > 0) {
        const firstItem = response.data.items[0];
        const slug = firstItem.product_slug || firstItem.product?.slug;
        setSelectedProductSlug(slug);
      }
    } catch (err) {
      console.error("Ошибка при получении сведений о заказе:", err);
      setError("Не удалось загрузить данные заказа. Пожалуйста, попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  // Открыть модальное окно для отмены заказа
  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  // Подтверждение отмены заказа
  const handleConfirmCancel = async () => {
    setCancelling(true);
    setShowCancelModal(false);
    
    try {
      await ordersAPI.cancelOrder(orderId);
      await fetchOrderDetail();
    } catch (err) {
      console.error("Ошибка при отмене заказа:", err);
      alert("Не удалось отменить заказ. Пожалуйста, попробуйте еще раз.");
    } finally {
      setCancelling(false);
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

  const getPaymentMethodDisplay = (provider) => {
    if (provider === 'heleket') return 'Оплата при получении';
    if (provider === 'stripe') return 'Банковская карта';
    if (provider === 'cash') return 'Наличными';
    return provider || 'Не указан';
  };

  const getPaymentStatusDisplay = (orderStatus, paymentProvider) => {
    if (orderStatus === 'cancelled') return 'Возврат';
    if (orderStatus === 'delivered') return 'Оплачен';
    if (orderStatus === 'processing') return 'В обработке';
    if (orderStatus === 'pending') {
      return paymentProvider === 'heleket' ? 'Ожидает оплаты при получении' : 'Ожидает оплаты';
    }
    if (orderStatus === 'completed') return 'Завершён';
    if (orderStatus === 'shipped') return 'Отправлен';
    if (orderStatus === 'failed') return 'Ошибка оплаты';
    return 'Не указан';
  };

  const getCurrentStep = () => {
    const status = order?.status;
    if (status === "cancelled" || status === "failed") return 0;
    return STATUS_MAP[status]?.step || 1;
  };

  const getProductSlug = (item) => {
    return item.product_slug || item.product?.slug || item.product?.product_slug;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Загрузка деталей заказа...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error || "Заказ не найден"}</p>
            <button
              onClick={() => navigate("/orders")}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Вернуться к заказам
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const currentStep = getCurrentStep();
  const isCancelled = order.status === "cancelled" || order.status === "failed";

  return (
    <>
      {/* Модальное окно для отмены заказа */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="Отмена заказа"
        message={`Вы уверены, что хотите отменить заказ #${order.id}? Товары будут возвращены в корзину.`}
        confirmText="Отменить заказ"
        cancelText="Оставить"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/orders"
              className="text-gray-600 hover:text-black transition inline-flex items-center gap-2 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Вернуться к заказам
            </Link>
            
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Заказ #{order.id}</h1>
                <p className="text-gray-600 mt-1">Размещён {formatDate(order.created_at)}</p>
              </div>
              <div className="flex gap-3">
                {order.status === "pending" && (
                  <button
                    onClick={handleCancelClick}
                    disabled={cancelling}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {cancelling ? "Отмена..." : "Отменить заказ"}
                  </button>
                )}
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${status.color}`}>
                  <span>{status.icon}</span> {status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Order Status Tracker */}
          {!isCancelled && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-6">Статус заказа</h2>
              <div className="relative">
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-200 rounded-full overflow-visible">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${Math.min((currentStep - 1) * 25, 100)}%`,
                      borderRight: '2px solid #1f6e3f',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div className="relative flex justify-between">
                  {ORDER_STEPS.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber <= currentStep;
                    const isCurrent = stepNumber === currentStep;
                    
                    return (
                      <div key={step.key} className="text-center" style={{ flex: 1 }}>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition z-10 relative ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-400"
                          } ${isCurrent ? "ring-4 ring-green-200" : ""}`}
                        >
                          {isCompleted ? "✓" : step.icon}
                        </div>
                        <p className={`text-sm font-medium ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Заказ товаров</h2>
                <div className="space-y-4">
                  {order.items?.map((item, idx) => {
                    const productSlug = getProductSlug(item);
                    return (
                      <div
                        key={idx}
                        className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="w-20 h-24 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-2xl">👕</span>
                        </div>
                        
                        <div className="flex-1">
                          <Link
                            to={productSlug ? `/product/${productSlug}` : "#"}
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
                    );
                  })}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Информация об оплате</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Способ оплаты:</span>
                    <span className="text-gray-900">{getPaymentMethodDisplay(order.payment_provider)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Статус платежа:</span>
                    <span className="text-gray-900">
                      {getPaymentStatusDisplay(order.status, order.payment_provider)}
                    </span>
                  </div>
                  {order.stripe_payment_intent_id && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Идентификатор транзакции:</span>
                      <span className="text-gray-900 text-xs font-mono">
                        {order.stripe_payment_intent_id.slice(-8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary & Shipping */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Сводка заказа</h2>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">Итого:</span>
                    <span className="text-gray-900">{formatPrice(order.total_price)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">Доставка:</span>
                    <span className="text-gray-900">Бесплатно</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between py-1 font-bold">
                      <span className="text-gray-900">Сумма:</span>
                      <span className="text-gray-900">{formatPrice(order.total_price)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              {(order.address1 || order.city) && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Информация о доставке</h2>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-medium">{order.first_name} {order.last_name}</p>
                    <p>{order.address1}</p>
                    {order.address2 && <p>{order.address2}</p>}
                    <p>{order.city}, {order.postal_code}</p>
                    <p>{order.country}</p>
                    {order.phone && <p className="mt-2">Телефон: {order.phone}</p>}
                    {order.email && <p>Email: {order.email}</p>}
                  </div>
                </div>
              )}

              {/* Review Button */}
              {order.status === "completed" && order.items?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
                  <div className="text-4xl mb-3">⭐</div>
                  <p className="text-gray-800 font-medium mb-3">
                    Понравился заказ? Поделитесь впечатлениями!
                  </p>
                  
                  {order.items?.length > 1 && (
                    <select
                      value={selectedProductSlug || getProductSlug(order.items[0])}
                      onChange={(e) => setSelectedProductSlug(e.target.value)}
                      className="mb-3 px-3 py-2 border border-gray-300 rounded text-sm w-full max-w-xs mx-auto block"
                    >
                      {order.items.map((item) => {
                        const slug = getProductSlug(item);
                        return (
                          <option key={item.id} value={slug}>
                            {item.product_name} ({item.size_name})
                          </option>
                        );
                      })}
                    </select>
                  )}
                  
                  <Link
                    to={`/product/${selectedProductSlug || getProductSlug(order.items[0])}`}
                    className="inline-block px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                  >
                    ✍️ Оставить отзыв
                  </Link>
                  
                  {order.items?.length > 1 && (
                    <p className="text-xs text-gray-500 mt-3">
                      Выберите товар, на который хотите оставить отзыв
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailPage;