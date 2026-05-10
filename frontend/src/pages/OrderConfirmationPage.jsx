import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (location.state?.order) {
      setOrder(location.state.order);
    } else {
      navigate('/');
    }
  }, [location, navigate]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
        {/* Иконка успеха */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Заказ подтверждён!
        </h1>
        
        <p className="text-gray-600 mb-2">
          Номер заказа: <span className="font-semibold text-gray-900">#{order.id}</span>
        </p>
        
        <p className="text-gray-500 text-sm mb-6">
          Спасибо за покупку! Наш менеджер свяжется с вами для подтверждения заказа.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(`/orders/${order.id}`)}
            className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Посмотреть детали заказа
          </button>
          
          <button
            onClick={() => navigate('/catalog')}
            className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Вернуться к покупкам
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;