import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { productsAPI } from "../api/products";
import { useCart } from "../contexts/CartContext";
import PlaceholderImage from '../components/PlaceholderImage';

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const { addToCart } = useCart();
  
  // Состояния фильтров
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    q: searchParams.get("q") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
    sort: searchParams.get("sort") || "newest",
  });

  useEffect(() => {
    fetchCatalog();
    fetchCategories();
  }, [searchParams]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const rawParams = Object.fromEntries(searchParams);
      const params = {};
        for (const [key, value] of Object.entries(rawParams)) {
            if (key === 'min_price' || key === 'max_price') {
                params[key] = parseFloat(value);
            } else {
                params[key] = value;
            }
        }
      const response = await productsAPI.getCatalog(params);
      setProducts(response.data.products);
    } catch (error) {
      console.error("Ошибка при получении каталога:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error("Ошибка при получении категорий:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
          // Для price преобразуем в число
        if (key === 'min_price' || key === 'max_price') {
          params.set(key, parseFloat(value));
        } else {
          params.set(key, value);
        }
      }
    });
    
    setSearchParams(params);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      q: "",
      min_price: "",
      max_price: "",
      size: "",
      color: "",
      sort: "newest",
    });
    setSearchParams({});
  };

  const formatPrice = (price) => {
    return `${Math.round(price)} BYN`;
};

  const handleAddToCart = async (product, sizeId = null) => {
    const result = await addToCart(product.slug, sizeId, 1);
    if (result.success) {
      alert(`${product.name} добавлен в корзину!`);
    } else {
      alert(result.error || "Не удалось добавить в корзину");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Загрузка товаров...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Каталог</h1>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
          >
            {filterOpen ? "Скрыть фильтры" : "Показать фильтры"}
          </button>
        </div>

        {/* Filters Panel */}
        {filterOpen && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Поиск
                </label>
                <input
                  type="text"
                  name="q"
                  value={filters.q}
                  onChange={handleFilterChange}
                  placeholder="Поиск товаров..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                >
                  <option value="">Все категории</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Размер
                </label>
                <select
                  name="size"
                  value={filters.size}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                >
                  <option value="">Все размеры</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Мин. цена (BYN)
                </label>
                <input
                  type="number"
                  name="min_price"
                  value={filters.min_price}
                  onChange={handleFilterChange}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Макс. цена (BYN)
                </label>
                <input
                  type="number"
                  name="max_price"
                  value={filters.max_price}
                  onChange={handleFilterChange}
                  placeholder="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сортировать по
                </label>
                <select
                  name="sort"
                  value={filters.sort}
                  onChange={handleFilterChange}
                >
                  <option value="newest">Новинки</option>
                  <option value="price_asc">Цена: по возрастанию</option>
                  <option value="price_desc">Цена: по убыванию</option>
                  <option value="name_asc">Название: А-Я</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
              >
                Применить фильтры
              </button>
              <button
                onClick={resetFilters}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Сбросить все
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">Товары не найдены.</p>
            <button
              onClick={resetFilters}
              className="mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
            >
              Очистить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition relative"
              >
                {/* Бейдж со скидкой */}
                {product.discount_percent > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      -{product.discount_percent}%
                    </div>
                  </div>
                )}

                <Link to={`/product/${product.slug}`}>
                  {product.image_url ? (
                    <img
                      src={`http://localhost:8000${product.image_url}`}
                      alt={product.name}
                      className="w-full h-64 object-cover hover:scale-105 transition duration-300"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/300x400/e5e7eb/9ca3af?text=No+Image';
                      }}
                    />
                  ) : (
                    <PlaceholderImage width={300} height={400} text={product.name} />
                  )}
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
                        <span className="text-sm text-gray-400 line-through ml-1">
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
                    onClick={() => handleAddToCart(product)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;