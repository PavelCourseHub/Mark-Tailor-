import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('order_id');


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Платеж отменён</h1>
        <p className="text-gray-600 mb-6">
          Ваш платеж не был завершен. Вы можете попробовать еще раз или продолжить покупки.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-4">Заказ #{orderId} был отменен.</p>
        )}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/cart')}
            className="w-full px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Вернуться в корзину
          </button>
          <button
            onClick={() => navigate('/catalog')}
            className="w-full px-6 py-3 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Продолжить покупки
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;