import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { productsAPI } from '../api/products';

const Header = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const hoverTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Загрузка категорий
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Ошибка при получении категорий:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
      setIsSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  // Обработчики для выпадающего меню
  const handleMouseEnter = (categoryId) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveCategory(categoryId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 150);
  };

  // Рендер подкатегорий для выпадающего меню
  const renderDropdownContent = (category) => {
    if (!category.children || category.children.length === 0) {
      return (
        <div className="p-4">
          <Link
            to={`/catalog?category=${category.slug}`}
            className="text-gray-600 hover:text-black"
            onClick={() => setActiveCategory(null)}
          >
            Все товары категории {category.name}
          </Link>
        </div>
      );
    }

    // Разбиваем подкатегории на колонки (максимум 4)
    const childrenCount = category.children.length;
    const columnsCount = Math.min(childrenCount, 4);
    const itemsPerColumn = Math.ceil(childrenCount / columnsCount);
    const columns = [];

    for (let i = 0; i < columnsCount; i++) {
      const start = i * itemsPerColumn;
      const end = start + itemsPerColumn;
      columns.push(category.children.slice(start, end));
    }

    return (
      <div className="p-6 min-w-[600px]">
        <div className="grid grid-cols-4 gap-6">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="space-y-3">
              {column.map((subcat) => (
                <div key={subcat.id}>
                  <Link
                    to={`/catalog?category=${subcat.slug}`}
                    className="font-medium text-gray-800 hover:text-black transition block"
                    onClick={() => setActiveCategory(null)}
                  >
                    {subcat.name}
                  </Link>
                  {subcat.children && subcat.children.length > 0 && (
                    <div className="ml-2 mt-1 space-y-1">
                      {subcat.children.map((child) => (
                        <Link
                          key={child.id}
                          to={`/catalog?category=${child.slug}`}
                          className="block text-sm text-gray-500 hover:text-black transition"
                          onClick={() => setActiveCategory(null)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <Link to="/" className="text-2xl font-bold text-black tracking-wide font-serif mr-12">
            Mark Tailor
          </Link>

           {/* Навигация с выпадающими подкатегориями */}
          <nav className="hidden md:flex space-x-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(category.id)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={`/catalog?category=${category.slug}`}
                  className="text-gray-800 hover:text-black transition text-sm uppercase tracking-wide font-medium whitespace-nowrap"
                >
                  {category.name}
                </Link>

                {/* Выпадающее меню с подкатегориями */}
                {activeCategory === category.id && category.children && category.children.length > 0 && (
                  <div 
                    className="absolute left-0 mt-2 bg-white shadow-lg rounded-md z-50"
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    }}
                    onMouseLeave={handleMouseLeave}
                  >
                    {renderDropdownContent(category)}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Поиск - увеличивается при фокусе */}
          <div 
            className={`hidden lg:flex flex-1 transition-all duration-300 ease-in-out ${
              isSearchFocused ? 'max-w-2xl mx-4' : 'max-w-md mx-8'
            }`}
          >
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Поиск"
                className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-gray-400 text-sm bg-gray-50 transition-all duration-300"
                style={{
                  width: isSearchFocused ? '100%' : 'auto',
                  minWidth: isSearchFocused ? '300px' : '200px',
                }}
              />
            </form>
          </div>

          {/* Действия пользователя */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <svg className="w-6 h-6 text-gray-700 hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <span className="text-gray-700">{user.first_name}</span>
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Личный кабинет
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Мои заказы
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition"
              >
                Войти
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden focus:outline-none"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
              />
            </form>
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              Главная
            </Link>
            <Link
              to="/catalog"
              className="block py-2 text-gray-700 hover:text-black"
              onClick={() => setIsMenuOpen(false)}
            >
              Каталог
            </Link>
            {user && (
              <>
                <Link
                  to="/orders"
                  className="block py-2 text-gray-700 hover:text-black"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Мои заказы
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-700 hover:text-black"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Личный кабинет
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-700 hover:text-black"
                >
                  Выйти
                </button>
              </>
            )}
            {!user && (
              <Link
                to="/login"
                className="block py-2 text-gray-700 hover:text-black"
                onClick={() => setIsMenuOpen(false)}
              >
                Войти
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;