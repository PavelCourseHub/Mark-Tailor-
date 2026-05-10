import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../api/payment';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId) {
        try {
          const response = await paymentAPI.handleSuccess(sessionId);
          const order = response.data.order;
          // Перенаправляем на страницу деталей заказа
          setTimeout(() => {
            navigate(`/orders/${order.id}`);
          }, 2000);
        } catch (error) {
          console.error('Payment verification failed:', error);
          navigate('/cart');
        }
      } else if (orderId) {
        // Если order_id уже есть, сразу перенаправляем
        setTimeout(() => {
          navigate(`/orders/${orderId}`);
        }, 2000);
      } else {
        navigate('/cart');
      }
    };

    verifyPayment();
  }, [sessionId, orderId, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Оплата прошла успешно!</h1>
        <p className="text-gray-600 mb-4">
          Перенаправление в историю заказов...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;