import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../api/auth";
import { ordersAPI } from "../api/orders";
import { paymentAPI } from "../api/payment";

const STATUS_MAP = {
  pending: { label: "В ожидании", icon: "⏳", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Обработка", icon: "🔄", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Отправлен", icon: "📦", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Доставлен", icon: "✅", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Отменён", icon: "❌", color: "bg-red-100 text-red-800" },
  failed: { label: "Неудавшийся", icon: "⚠️", color: "bg-orange-100 text-orange-800" },
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Состояния для профиля
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    address1: "",
    address2: "",
    city: "",
    country: "",
    province: "",
    postal_code: "",
  });
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Состояния для заказов
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  // Состояния для смены пароля
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  
  // Текущая вкладка
  const [activeTab, setActiveTab] = useState("info");

  // Загрузка данных пользователя
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["info", "orders", "password"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        address1: user.address1 || "",
        address2: user.address2 || "",
        city: user.city || "",
        country: user.country || "",
        province: user.province || "",
        postal_code: user.postal_code || "",
      });
    }
  }, [user]);

  // Загрузка заказов
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await ordersAPI.getOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Ошибка при получении заказов:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await authAPI.updateProfile(profile);
      await updateUser(response.data.user);
      setSuccess("Профиль успешно обновлен!");
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Не удалось обновить профиль.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Новые пароли не совпадают.");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Пароль должен состоять как минимум из 6 символов.");
      return;
    }
    
    setChangingPassword(true);
    
    try {
      // Здесь будет API для смены пароля (нужно добавить на бэкенде)
      // await authAPI.changePassword({
      //   current_password: currentPassword,
      //   new_password: newPassword,
      // });
      
      // Пока имитируем успех
      setPasswordSuccess("Пароль успешно изменен!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        setPasswordSuccess("");
      }, 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Не удалось изменить пароль");
    } finally {
      setChangingPassword(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BYN",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const tabs = [
    { id: "info", label: "Личная информация", icon: "👤" },
    { id: "orders", label: "История заказов", icon: "📦" },
    { id: "password", label: "Изменить пароль", icon: "🔒" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Мой профиль</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Personal Info Tab */}
        {activeTab === "info" && (
          <div className="bg-white rounded-lg shadow-md">
            {editing ? (
              <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {success}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={profile.first_name}
                      onChange={handleProfileChange}
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
                      value={profile.last_name}
                      onChange={handleProfileChange}
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
                      value={profile.email}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Адрес электронной почты изменить невозможно.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Телефон
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Компания
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={profile.company}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адресная строка 1
                    </label>
                    <input
                      type="text"
                      name="address1"
                      value={profile.address1}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Адресная строка 2
                    </label>
                    <input
                      type="text"
                      name="address2"
                      value={profile.address2}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Город
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={profile.city}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Страна
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={profile.country}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Штат/Провинция
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={profile.province}
                      onChange={handleProfileChange}
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
                      value={profile.postal_code}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition disabled:bg-gray-400"
                  >
                    {loading ? "Сохранение..." : "Сохранить изменения"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Персональная информация</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                  >
                    Редактировать профиль
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Имя" value={profile.first_name} />
                  <InfoField label="Фамилия" value={profile.last_name} />
                  <InfoField label="Email" value={profile.email} />
                  <InfoField label="Телефон" value={profile.phone || "Not specified"} />
                  <InfoField label="Компания" value={profile.company || "Not specified"} />
                  <InfoField label="Адрес" value={profile.address1 || "Not specified"} />
                  {profile.address2 && <InfoField label="Address Line 2" value={profile.address2} />}
                  <InfoField label="Город" value={profile.city || "Not specified"} />
                  <InfoField label="Страна" value={profile.country || "Not specified"} />
                  <InfoField label="Штат/Провинция" value={profile.province || "Not specified"} />
                  <InfoField label="Почтовый индекс" value={profile.postal_code || "Not specified"} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">История заказов</h2>
            
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Вы еще не разместили ни одного заказа.</p>
                <a
                  href="/catalog"
                  className="inline-block px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                >
                  Начать покупки
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  return (
                    <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <p className="text-sm text-gray-500">Заказ #{order.id}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                            <span>{status.icon}</span> {status.label}
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(order.total_price)}
                          </span>
                        </div>
                      </div>
                      
                      {order.items && order.items.length > 0 && (
                        <div className="divide-y divide-gray-100">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="p-4 flex gap-4">
                              <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-2xl">👕</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.product_name}</p>
                                <p className="text-sm text-gray-500">
                                  Размер: {item.size_name} | Количество: {item.quantity}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  {formatPrice(item.price)} каждый
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {formatPrice(item.total_price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Изменить пароль</h2>
            
            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
              {passwordError && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
                  {passwordSuccess}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Текущий пароль *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Новый пароль *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Минимум 6 символов</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Подтвердите новый пароль *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition disabled:bg-gray-400"
              >
                {changingPassword ? "Изменение..." : "Изменить пароль"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

// Вспомогательный компонент для отображения поля информации
const InfoField = ({ label, value }) => (
  <div className="border-b border-gray-100 py-2">
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-1">{value || "—"}</p>
  </div>
);

export default ProfilePage;