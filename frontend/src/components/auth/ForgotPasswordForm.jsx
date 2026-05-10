import { useState } from 'react';
import { authAPI } from '../../api/auth';

const ForgotPasswordForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Пожалуйста, введите корректный email адрес');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      console.error('Ошибка восстановления пароля:', error);
      // Для безопасности не показываем, существует ли email
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-5">
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
          Инструкции по сбросу пароля отправлены на ваш email, если он зарегистрирован в системе.
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition"
        >
          Вернуться ко входу
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-gray-600">
        Введите ваш email адрес, и мы отправим ссылку для сброса пароля.
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black transition"
          disabled={loading}
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Отправка...' : 'Отправить ссылку'}
      </button>
      
      <p className="text-center text-sm text-gray-600">
        Вспомнили пароль?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-black font-semibold hover:underline focus:outline-none"
        >
          Вернуться ко входу
        </button>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;