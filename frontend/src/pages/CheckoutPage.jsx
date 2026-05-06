import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { ordersAPI } from "../api/orders";

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  // Состояния для доставки
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    country: "",
    province: "",
    postal_code: "",
  });
  
  // Состояния для оплаты
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Функция для форматирования цены
  const formatPrice = (price) => {
    const num = typeof price === 'number' ? price : parseFloat(price || 0);
    return `${Math.round(num)} BYN`;
};

  // Получение суммы корзины
  const getSubtotal = () => {
    return typeof cart?.subtotal === 'number' ? cart.subtotal : parseFloat(cart?.subtotal || 0);
  };

  // Получение общей суммы с доставкой
  const getTotalPrice = () => {
    const subtotal = getSubtotal();
    const shipping = deliveryMethod === "courier" ? 10 : 0;
    return subtotal + shipping;
  };

  // Заполняем данные из профиля пользователя
  useEffect(() => {
    if (user) {
      setDeliveryAddress({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address1: user.address1 || "",
        address2: user.address2 || "",
        city: user.city || "",
        country: user.country || "",
        province: user.province || "",
        postal_code: user.postal_code || "",
      });
    }
  }, [user]);

  // Проверяем, пуста ли корзина
  if (!cart || cart.total_items === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Ваша корзина пуста</h1>
          <p className="text-gray-600 mb-8">Добавьте товары в корзину перед оформлением заказа.</p>
          <button
            onClick={() => navigate("/catalog")}
            className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition"
          >
            Продолжить покупки
          </button>
        </div>
      </div>
    );
  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    
    // Валидация для доставки курьером
    if (deliveryMethod === "courier") {
      if (!deliveryAddress.address1 || !deliveryAddress.city || !deliveryAddress.country) {
        setError("Пожалуйста, заполните все обязательные поля адреса (Адрес, Город, Страна).");
        return;
      }
    }

    setSubmitting(true);

    try {
      // Базовые данные заказа
      const orderData = {
        first_name: deliveryAddress.first_name,
        last_name: deliveryAddress.last_name,
        email: deliveryAddress.email,
        phone: deliveryAddress.phone || "",
        payment_provider: paymentMethod === "card" ? "stripe" : "heleket",
        delivery_method: deliveryMethod,  // Отправляем способ доставки
      };

      // Добавляем адресные поля ТОЛЬКО для курьерской доставки
      if (deliveryMethod === "courier") {
        orderData.address1 = deliveryAddress.address1;
        orderData.address2 = deliveryAddress.address2 || "";
        orderData.city = deliveryAddress.city;
        orderData.country = deliveryAddress.country;
        orderData.province = deliveryAddress.province || "";
        orderData.postal_code = deliveryAddress.postal_code || "";
      } else {
        // Для самовывоза отправляем пустые строки
        orderData.address1 = "";
        orderData.address2 = "";
        orderData.city = "";
        orderData.country = "";
        orderData.province = "";
        orderData.postal_code = "";
      }

      console.log("Sending order data:", orderData);

      // Создаем заказ
      const response = await ordersAPI.createOrder(orderData);
      const { order, checkout_url } = response.data;

      if (checkout_url) {
        // Редирект на страницу оплаты Stripe
        window.location.href = checkout_url;
      } else {
        // Если оплата не требуется
        await clearCart();
        navigate("/payment/success", { state: { order } });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.error || err.response?.data?.message || "Не удалось обработать заказ. Пожалуйста, попробуйте еще раз.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Оформление заказа</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Способ доставки</h2>
              
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  deliveryMethod === "pickup" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryMethod === "pickup"}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Самовывоз из магазина</p>
                    <p className="text-sm text-gray-500">Бесплатно - Забрать в нашем пункте выдачи</p>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  deliveryMethod === "courier" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="delivery"
                    value="courier"
                    checked={deliveryMethod === "courier"}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Курьерская доставка</p>
                    <p className="text-sm text-gray-500">10,00 BYN - Доставка по вашему адресу</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Delivery Address Form (only for courier) */}
            {deliveryMethod === "courier" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Адрес доставки</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={deliveryAddress.first_name}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Фамилия *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={deliveryAddress.last_name}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={deliveryAddress.email}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={deliveryAddress.phone}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адресная строка 1 *
                    </label>
                    <input
                      type="text"
                      name="address1"
                      value={deliveryAddress.address1}
                      onChange={handleAddressChange}
                      placeholder="Street, House number"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адресная строка 2 (необязательно)
                    </label>
                    <input
                      type="text"
                      name="address2"
                      value={deliveryAddress.address2}
                      onChange={handleAddressChange}
                      placeholder="Apartment, Suite, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Город *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={deliveryAddress.city}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Страна *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={deliveryAddress.country}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Штат/Провинция
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={deliveryAddress.province}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Почтовый индекс
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={deliveryAddress.postal_code}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Способ оплаты</h2>
              
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "card" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Кредитная/дебетовая карта</p>
                    <p className="text-sm text-gray-500">Оплачивайте покупки безопасно через Stripe.</p>
                  </div>
                </label>

                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "cash" ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Оплата при получении</p>
                    <p className="text-sm text-gray-500">Оплатите заказ при его получении.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Сводка заказа</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {cart?.items?.map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 border-b">
                    <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-2xl">👕</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Размер: {item.size_name}</p>
                      <p className="text-sm text-gray-500">Количество: {item.quantity}</p>
                      <p className="font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Доставка</span>
                  <span>{deliveryMethod === "pickup" ? "0.00 BYN" : "10.00 BYN"}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Сумма</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-6 bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? "Обработка..." : `Оформить заказ • ${formatPrice(getTotalPrice())}`}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;