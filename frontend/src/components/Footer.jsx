import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Mark Tailor</h3>
            <p className="text-gray-400 text-sm">
              Одежда премиум-класса, сшитая специально для вас. Качество и стиль с 2024 года.
            </p>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Быстрые ссылки</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/catalog" className="text-gray-400 hover:text-white transition">
                  Каталог
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition">
                  О нас
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition">
                  Контакт
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Обслуживание клиентов</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition">
                  Часто задаваемые вопросы
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-400 hover:text-white transition">
                  Информация о доставке
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-400 hover:text-white transition">
                  Возврат
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Связаться с нами</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Эл.почта: info@marktailor.com</li>
              <li>Телефон: +375 29 111 11 11</li>
              <li>Адрес: пр-т Победителей 128</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 Mark Tailor. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;