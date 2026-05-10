import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI } from '../api/products';

const ReviewSection = ({ productSlug }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
    if (isAuthenticated) {
      checkCanReview();
    }
  }, [productSlug, isAuthenticated]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getProductReviews(productSlug);
      setReviews(response.data.reviews);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await productsAPI.canReview(productSlug);
      setCanReview(response.data.can_review);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Пожалуйста, напишите комментарий');
      return;
    }
    
    if (rating < 1 || rating > 5) {
    setError('Пожалуйста, выберите оценку');
    return;
    }

    setSubmitting(true);
    setError('');
    
    try {
    // Отправляем ТОЛЬКО rating и comment (без product)
    const response = await productsAPI.createReview(productSlug, { 
      rating: rating, 
      comment: comment.trim() 
    });
    
    console.log('Review created:', response.data);
    setShowForm(false);
    setRating(5);
    setComment('');
    fetchReviews();  // Перезагружаем список отзывов
    setCanReview(false);
    
    // Показываем успешное сообщение
    alert('Спасибо за отзыв! Он будет опубликован после проверки модератором.');
    
  } catch (error) {
    console.error('Review error:', error);
    console.error('Error response:', error.response?.data);
    
    const errorMsg = error.response?.data?.comment?.[0] || 
                     error.response?.data?.rating?.[0] ||
                     error.response?.data?.error || 
                     'Не удалось отправить отзыв. Пожалуйста, попробуйте еще раз.';
    setError(errorMsg);
  } finally {
    setSubmitting(false);
  }
};

  const handleHelpful = async (reviewId) => {
    try {
      await productsAPI.markReviewHelpful(reviewId);
      fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const renderStars = (rating, size = 'text-xl') => {
    return (
      <div className={`${size} text-yellow-500`}>
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Загрузка отзывов...</div>;
  }

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-2xl font-bold mb-6">Отзывы покупателей</h3>
      
      {/* Статистика оценок */}
      <div className="flex flex-wrap gap-8 mb-8 p-6 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900">{stats.average_rating.toFixed(1)}</div>
          <div className="mt-1">{renderStars(Math.round(stats.average_rating), 'text-2xl')}</div>
          <div className="text-sm text-gray-500 mt-1">На основе {stats.total_reviews} отзывов</div>
        </div>
        
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.distribution[star] || 0;
            const percent = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="w-8 text-sm">{star} ★</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-10 text-sm text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Кнопка "Написать отзыв" */}
      {canReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          ✍️ Написать отзыв
        </button>
      )}
      
      {/* Форма отзыва */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-lg mb-4">Оставить отзыв</h4>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Оценка</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
              placeholder="Поделитесь впечатлениями о товаре..."
            />
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Отмена
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">Отзывы проходят модерацию перед публикацией</p>
        </form>
      )}
      
      {/* Список отзывов */}
      {reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Пока нет отзывов. Будьте первым!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-gray-900">
                    {review.user_name || review.user_email}
                  </div>
                  <div className="mt-1">{renderStars(review.rating)}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
              
              <p className="text-gray-700 mt-3">{review.comment}</p>
              
              {review.is_verified_purchase && (
                <span className="inline-block mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✓ Подтверждённая покупка
                </span>
              )}
              
              <button
                onClick={() => handleHelpful(review.id)}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                👍 Полезный отзыв ({review.helpful_count})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;