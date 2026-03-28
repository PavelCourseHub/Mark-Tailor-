import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api/products';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

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
      console.error('Error fetching home data:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product, sizeId = null) => {
    try {
      const result = await addToCart(product.slug, sizeId, 1);
      if (result.success) {
        // Показываем уведомление (можно добавить toast уведомления)
        alert(`${product.name} added to cart!`);
      } else {
        alert(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Failed to add to cart');
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
            Try Again
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
  return (
    <div className="relative bg-black text-white">
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover opacity-50"
          src="/api/placeholder/1920/600"
          alt="Hero background"
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Welcome to Mark Tailor
        </h1>
        <p className="mt-6 text-xl max-w-2xl mx-auto">
          Discover our collection of premium clothing tailored just for you
        </p>
        <div className="mt-10">
          <Link
            to="/catalog"
            className="inline-block bg-white text-black px-8 py-3 text-lg font-semibold hover:bg-gray-100 transition"
          >
            Shop Now
          </Link>
        </div>
        {user && (
          <p className="mt-4 text-sm">
            Welcome back, {user.first_name}!
          </p>
        )}
      </div>
    </div>
  );
};

// Categories Section Component
const CategoriesSection = ({ categories }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/catalog?category=${category.slug}`}
            className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition"
          >
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={category.image_url || '/api/placeholder/400/300'}
                alt={category.name}
                className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition">
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-center">
                <h3 className="text-xl font-semibold">{category.name}</h3>
                <p className="text-sm mt-1">Shop Now →</p>
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
      <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
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
          View All Products
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
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden">
          <img
            src={product.image_url || '/api/placeholder/300/400'}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition duration-300"
          />
          {product.stock === 0 && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-sm">
              Sold Out
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-lg font-semibold mb-2 hover:text-gray-600 transition">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-600 text-sm mb-2">{product.category_name}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold">{product.price_display}</span>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className={`px-4 py-2 text-sm font-semibold transition ${
              product.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

// Promo Banner Component
const PromoBanner = () => {
  return (
    <div className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Summer Collection 2024</h2>
        <p className="text-xl mb-6">Get up to 30% off on selected items</p>
        <Link
          to="/catalog"
          className="inline-block bg-white text-black px-8 py-3 font-semibold hover:bg-gray-100 transition"
        >
          Shop Sale
        </Link>
      </div>
    </div>
  );
};

// Newsletter Section Component
const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      // Здесь будет API запрос для подписки на новости
      console.log('Subscribing email:', email);
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
    }
  };

  return (
    <div className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
        <p className="text-gray-600 mb-8">
          Get the latest updates on new products and special offers
        </p>
        
        {subscribed ? (
          <div className="max-w-md mx-auto bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Thank you for subscribing!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-black"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HomePage;