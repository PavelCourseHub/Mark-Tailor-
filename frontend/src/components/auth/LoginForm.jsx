import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setErrors({ general: 'Пожалуйста, заполните все поля.' });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setErrors({ general: result.error || 'Неверный адрес электронной почты или пароль.' });
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.general && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {errors.general}
        </div>
      )}
      
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black transition"
          disabled={loading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Пароль *
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black transition"
          disabled={loading}
        />
      </div>
      
      <div className="text-right">
        <button
          type="button"
          onClick={onSwitchToForgot}
          className="text-sm text-gray-600 hover:text-black transition focus:outline-none"
        >
          Забыли пароль?
        </button>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Вход в профиль...' : 'Войти'}
      </button>
      
      <p className="text-center text-sm text-gray-600">
        У вас нет аккаунта?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-black font-semibold hover:underline focus:outline-none"
        >
          Зарегистрироваться
        </button>
      </p>
    </form>
  );
};

export default LoginForm;