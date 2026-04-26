import { useState } from 'react';
import { authAPI } from '../../api/auth';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку для этого поля при вводе
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Имя';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Фамилия';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен состоять как минимум из 6 символов.';
    }
    if (!formData.password2) {
      newErrors.password2 = 'Пожалуйста, подтвердите свой пароль';
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = 'Пароли не совпадают';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      const response = await authAPI.register(formData);
      
      if (response.status === 201) {
        setSuccessMessage('Регистрация прошла успешно! Пожалуйста, войдите в систему.');
        // Автоматически переключаемся на форму входа через 2 секунды
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data) {
        // Обработка ошибок от сервера
        const serverErrors = error.response.data;
        
        if (typeof serverErrors === 'object') {
          const fieldErrors = {};
          
          if (serverErrors.email) {
            fieldErrors.email = serverErrors.email[0];
          }
          if (serverErrors.username) {
            fieldErrors.username = serverErrors.username[0];
          }
          if (serverErrors.password) {
            fieldErrors.password = serverErrors.password[0];
          }
          if (serverErrors.password2) {
            fieldErrors.password2 = serverErrors.password2[0];
          }
          if (serverErrors.non_field_errors) {
            setErrors({ general: serverErrors.non_field_errors[0] });
          }
          
          setErrors(fieldErrors);
        } else if (typeof serverErrors === 'string') {
          setErrors({ general: serverErrors });
        }
      } else {
        setErrors({ general: 'Регистрация не удалась. Пожалуйста, попробуйте еще раз' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {successMessage && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
          {successMessage}
        </div>
      )}
      
      {errors.general && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {errors.general}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            Имя *
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:border-black transition`}
            disabled={loading}
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            Фамилия *
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:border-black transition`}
            disabled={loading}
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Эл.почта *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:border-black transition`}
          disabled={loading}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
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
          className={`w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:border-black transition`}
          disabled={loading}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Минимум 6 символов</p>
      </div>
      
      <div>
        <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-1">
          Подтвердите пароль *
        </label>
        <input
          id="password2"
          name="password2"
          type="password"
          value={formData.password2}
          onChange={handleChange}
          className={`w-full px-4 py-2 border ${errors.password2 ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:border-black transition`}
          disabled={loading}
        />
        {errors.password2 && (
          <p className="mt-1 text-xs text-red-500">{errors.password2}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Создание учетной записи...' : 'Зарегистрироваться'}
      </button>
      
      <p className="text-center text-sm text-gray-600">
        У вас уже есть аккаунт?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-black font-semibold hover:underline focus:outline-none"
        >
          Войти
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;