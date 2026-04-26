import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

const AuthView = {
  LOGIN: 'login',
  REGISTER: 'register',
  FORGOT: 'forgot',
};

const titles = {
  [AuthView.LOGIN]: 'Войти',
  [AuthView.REGISTER]: 'Зарегистрироваться',
  [AuthView.FORGOT]: 'Сбросить пароль',
};

const AuthPage = () => {
  const [view, setView] = useState(AuthView.LOGIN);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12">
        <div className="text-white text-center space-y-6">
          <h1 className="font-serif text-5xl font-bold tracking-tight">
            Mark Tailor
          </h1>
          <p className="text-lg opacity-80 max-w-sm mx-auto font-light">
            Стиль, подчеркивающий вашу индивидуальность.
          </p>
          <div className="w-16 h-px bg-white/30 mx-auto" />
          <p className="text-sm opacity-50 uppercase tracking-[0.2em]">
            Одежда &middot; Обувь &middot; Аксессуары
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <h1 className="font-serif text-3xl font-bold text-gray-900">Mark Tailor</h1>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-semibold text-gray-900">
              {titles[view]}
            </h2>
            <div className="w-10 h-0.5 bg-gray-900 mt-2" />
          </div>

          {view === AuthView.LOGIN && (
            <LoginForm
              onSwitchToRegister={() => setView(AuthView.REGISTER)}
              onSwitchToForgot={() => setView(AuthView.FORGOT)}
            />
          )}
          
          {view === AuthView.REGISTER && (
            <RegisterForm onSwitchToLogin={() => setView(AuthView.LOGIN)} />
          )}
          
          {view === AuthView.FORGOT && (
            <ForgotPasswordForm onSwitchToLogin={() => setView(AuthView.LOGIN)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;