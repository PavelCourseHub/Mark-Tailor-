import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productsAPI } from "../api/products";
import { useCart } from "../contexts/CartContext";
import PlaceholderImage from '../components/PlaceholderImage';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Для слайдера
  const [selectedImage, setSelectedImage] = useState(null);
  const [allImages, setAllImages] = useState([]);
  
  const { addToCart } = useCart();

  // Функция для получения правильного URL изображения
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:8000${imagePath}`;
  };

  useEffect(() => {
    fetchProductDetail();
  }, [slug]);

  const fetchProductDetail = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getProduct(slug);
      setProduct(response.data.product);
      setRelatedProducts(response.data.related_products || []);
      
      // Собираем все изображения для слайдера
      const images = [];
      
      // Добавляем главное изображение
      if (response.data.product.main_image) {
        images.push({
          id: 'main',
          image: response.data.product.main_image,
          alt_text: response.data.product.name
        });
      }
      
      // Добавляем дополнительные изображения
      if (response.data.product.images && response.data.product.images.length > 0) {
        images.push(...response.data.product.images);
      }
      
      setAllImages(images);
      
      // Устанавливаем первое изображение как выбранное
      if (images.length > 0) {
        setSelectedImage(images[0].image);
      }
      
      // Auto-select first available size
      if (response.data.product.sizes && response.data.product.sizes.length > 0) {
        setSelectedSize(response.data.product.sizes[0]);
      }
    } catch (error) {
      console.error("Ошибка при получении товара:", error);
      navigate("/catalog");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BYN",
    }).format(price);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (selectedSize?.stock || 10)) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert("Пожалуйста, выберите размер");
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(product.slug, selectedSize.id, quantity);
    if (result.success) {
      alert(`${product.name} добавлен в корзину!`);
    } else {
      alert(result.error || "Не удалось добавить в корзину");
    }
    setAddingToCart(false);
  };

  // Функция для получения цены со скидкой
  const getCurrentPrice = () => {
    if (product.is_on_sale) {
      return product.sale_price;
    }
    return product.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Загрузка продукта...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-gray-500">
          <Link to="/" className="hover:text-black">Главная</Link>
          {" / "}
          <Link to="/catalog" className="hover:text-black">Каталог</Link>
          {" / "}
          {product.category_name && (
            <>
              <Link to={`/catalog?category=${product.category_slug}`} className="hover:text-black">
                {product.category_name}
              </Link>
              {" / "}
            </>
          )}
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Product Detail */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Бейдж со скидкой на странице товара */}
          {product.discount_percent > 0 && (
            <div className="absolute top-4 right-4 z-20 ml-4 mt-4">
              <div className="bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
                Скидка -{product.discount_percent}%
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Product Images with Slider */}
            <div>
              {/* Main Image */}
              <div className="mb-4 relative">
                {selectedImage ? (
                  <img
                    src={getImageUrl(selectedImage)}
                    alt={product.name}
                    className="w-full h-96 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/500x600/e5e7eb/9ca3af?text=No+Image';
                    }}
                  />
                ) : (
                  <PlaceholderImage width={500} height={600} text={product.name} />
                )}
              </div>
              
              {/* Thumbnails Slider */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, index) => (
                    <button
                      key={img.id || index}
                      onClick={() => setSelectedImage(img.image)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === img.image 
                          ? 'border-black' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={getImageUrl(img.image)}
                        alt={img.alt_text || product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/100x100/e5e7eb/9ca3af?text=No+Image';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-500 mb-4">{product.category_name}</p>
              
              {/* Цены со скидкой */}
              <div className="mb-4">
                {product.is_on_sale ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-red-600">
                      {Number(product.sale_price).toFixed(2)} BYN
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      {Number(product.price).toFixed(2)} BYN
                    </span>
                    <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                      -{product.discount_percent}%
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {Number(product.price).toFixed(2)} BYN
                  </span>
                )}
              </div>

              <div className="mb-6">
                <p className="text-gray-700">{product.description}</p>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выберите размер *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border rounded transition ${
                          selectedSize?.id === size.id
                            ? "border-black bg-black text-white"
                            : "border-gray-300 hover:border-black"
                        } ${size.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={size.stock === 0}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                  {selectedSize && selectedSize.stock === 0 && (
                    <p className="text-red-500 text-sm mt-2">Распродано</p>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="w-10 h-10 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min="1"
                    max={selectedSize?.stock || 10}
                    className="w-20 text-center px-2 py-2 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSize?.stock || 0} товаров доступно
                </p>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedSize || selectedSize.stock === 0}
                className="w-full py-3 bg-black text-white rounded font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {addingToCart 
                  ? "Добавление..." 
                  : `Добавить в корзину - ${formatPrice(getCurrentPrice() * quantity)}`}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Вам также может понравиться</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <div
                  key={related.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition relative"
                >
                  {/* Бейдж со скидкой для связанных товаров */}
                  {related.discount_percent > 0 && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{related.discount_percent}%
                      </div>
                    </div>
                  )}

                  <Link to={`/product/${related.slug}`}>
                    <img
                      src={getImageUrl(related.image_url)}
                      alt={related.name}
                      className="w-full h-48 object-cover hover:scale-105 transition duration-300"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/300x400/e5e7eb/9ca3af?text=No+Image';
                      }}
                    />
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${related.slug}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-gray-600 transition line-clamp-2 min-h-[56px]">
                        {related.name}
                      </h3>
                    </Link>
                    
                    {/* Цены для связанных товаров */}
                    <div className="mt-2">
                      {related.is_on_sale ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold text-red-600">
                            {Number(related.sale_price).toFixed(2)} BYN
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {Number(related.price).toFixed(2)} BYN
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {Number(related.price).toFixed(2)} BYN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;