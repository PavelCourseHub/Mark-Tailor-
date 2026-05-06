import { useState, useEffect } from 'react';

const CategorySlider = ({ category }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalTime = 5000; // 5 секунд

  useEffect(() => {
    const allImages = [];
    
    if (category.image_url) {
      allImages.push(category.image_url);
    }
    if (category.image_2) {
      allImages.push(category.image_2);
    }
    if (category.image_3) {
      allImages.push(category.image_3);
    }
    if (category.image_4) {
      allImages.push(category.image_4);
    }
    
    setImages(allImages);
    setCurrentIndex(0);
  }, [category]);

  useEffect(() => {
    if (images.length <= 1) return;
    
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 300);
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400">Нет изображения</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 overflow-hidden">
      {/* Основное изображение с плавным переходом */}
      <div className="relative w-full h-full">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={`http://localhost:8000${img}`}
            alt={category.name}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
              currentIndex === idx && !isTransitioning
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0'
            }`}
          />
        ))}
      </div>

      {/* Индикаторы (точки) */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? 'bg-white w-6'
                  : 'bg-white/50 w-2 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategorySlider;