import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api/products';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import PlaceholderImage from '../components/PlaceholderImage';
import CategorySlider from '../components/CategorySlider';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getCatalog({ page: 1, page_size: 8 });
      
      // Получаем категории
      const categoriesResponse = await productsAPI.getCategories();
      setCategories(categoriesResponse.data.categories.slice(0, 6));
      
      // Получаем товары для главной страницы
      setFeaturedProducts(response.data.products);
      
    } catch (err) {
      console.error('Ошибка при получении данных о домашнем аккаунте:', err);
      setError('Не удалось загрузить товары. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product, sizeId = null) => {
    try {
      const result = await addToCart(product.slug, sizeId, 1);
      if (result.success) {
        alert(`${product.name} добавлен в корзину!`);
      } else {
        alert(result.error || 'Не удалось добавить в корзину');
      }
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
      alert('Не удалось добавить в корзину');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-xl">{error}</p>
          <button 
            onClick={fetchHomeData}
            className="mt-4 px-6 py-2 bg-black text-white hover:bg-gray-800 transition"
          >
            Попробуйте еще раз
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection user={user} />

      {/* Categories Section */}
      <CategoriesSection categories={categories} />

      {/* Featured Products Section */}
      <FeaturedProductsSection 
        products={featuredProducts} 
        onAddToCart={handleAddToCart}
      />

      {/* Promo Banner */}
      <PromoBanner />

      {/* Newsletter Section */}
      <NewsletterSection />
    </div>
  );
};

// Hero Section Component
const HeroSection = ({ user }) => {
  // Формируем приветствие в зависимости от того, авторизован пользователь или нет
  const greeting = user 
    ? `Добро пожаловать, ${user.first_name}!` 
    : 'Добро пожаловать в Mark Tailor';

  return (
    <div className="relative bg-black text-white">
      <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          {greeting}
        </h1>
        <p className="mt-6 text-xl max-w-2xl mx-auto text-gray-200">
          Откройте для себя нашу коллекцию одежды премиум-класса, созданную специально для вас
        </p>
        <div className="mt-10">
          <Link
            to="/catalog"
            className="inline-block bg-white text-black px-8 py-3 text-lg font-semibold hover:bg-gray-100 transition"
          >
            Купить сейчас
          </Link>
        </div>
      </div>
    </div>
  );
};

// Categories Section Component
const CategoriesSection = ({ categories }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center mb-12">Магазин по категориям</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/catalog?category=${category.slug}`}
            className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition"
          >
            <CategorySlider category={category} />
            <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition">
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-center">
                <h3 className="text-xl font-semibold">{category.name}</h3>
                <p className="text-sm mt-1">Купить сейчас →</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Featured Products Section Component
const FeaturedProductsSection = ({ products, onAddToCart }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center mb-12">Рекомендуемые продукты</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
      <div className="text-center mt-12">
        <Link
          to="/catalog"
          className="inline-block border-2 border-black text-black px-8 py-3 font-semibold hover:bg-black hover:text-white transition"
        >
          Просмотреть все продукты
        </Link>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Бейдж со скидкой */}
      {product.discount_percent > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
            -{product.discount_percent}%
          </div>
        </div>
      )}

      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden">
          {product.image_url ? (
            <img
              src={`http://localhost:8000${product.image_url}`}
              alt={product.name}
              className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
              onError={(e) => {
                console.error('Image load error - URL:', product.image_url);
                e.target.src = 'https://placehold.co/300x400/e5e7eb/9ca3af?text=No+Image';
              }}
            />
          ) : (
            <PlaceholderImage width={300} height={400} text={product.name} />
          )}
          {product.stock === 0 && (
            <div className="absolute top-2 left-2 bg-gray-600 text-white px-2 py-1 text-xs rounded">
              Нет в наличии
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-semibold text-gray-900 hover:text-gray-600 transition line-clamp-2 min-h-[56px]">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mt-1">{product.category_name}</p>
        
        {/* Цены со скидкой */}
        <div className="mt-2">
          {product.is_on_sale ? (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                  %
                </div>
                <span className="text-lg font-bold text-red-600">
                  {Math.round(product.sale_price)} BYN
                </span>
              </div>
              <span className="text-sm text-gray-400 line-through">
                {Math.round(product.price)} BYN
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {Math.round(product.price)} BYN
            </span>
          )}
        </div>
                
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className={`mt-3 w-full py-2 text-sm font-semibold transition rounded ${
            product.stock === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
        </button>
      </div>
    </div>
  );
};

// Promo Banner Component
const PromoBanner = () => {
  return (
    <div className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          Летняя коллекция 2026 года
        </h1>
        <p className="text-xl mb-6">Скидка до 30% на отдельные товары.</p>
        <Link
          to="/catalog?category=rasprodazha"
          className="inline-block bg-white text-black px-8 py-3 font-semibold hover:bg-gray-100 transition"
        >
          Перейти к распродаже
        </Link>
      </div>
    </div>
  );
};

// Newsletter Section Component
const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    
    try {
      await productsAPI.subscribe(email);
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('Ошибка подписки:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Не удалось подписаться. Попробуйте позже.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Подпишитесь на нашу рассылку</h2>
        <p className="text-gray-600 mb-8">
          Получайте самую свежую информацию о новых продуктах и специальных предложениях.
        </p>
        
        {subscribed ? (
          <div className="max-w-md mx-auto bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Спасибо за подписку! Проверьте вашу почту.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите свой email"
              className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black rounded"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition rounded disabled:bg-gray-400"
            >
              {loading ? 'Подписка...' : 'Подписаться'}
            </button>
          </form>
        )}
        
        {error && (
          <div className="mt-4 max-w-md mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;