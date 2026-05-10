import { useEffect } from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Удалить', cancelText = 'Отмена' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Затемнение */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Модальное окно */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-modal-slide-in">
        {/* Иконка */}
        <div className="pt-6 text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>
        
        {/* Заголовок */}
        <div className="text-center px-6 mt-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        
        {/* Сообщение */}
        <div className="px-6 py-4 text-center">
          <p className="text-gray-600">{message}</p>
        </div>
        
        {/* Кнопки */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-center font-semibold text-red-600 hover:bg-red-50 transition rounded-bl-2xl"
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 text-center font-semibold text-gray-500 hover:bg-gray-50 transition border-l border-gray-100 rounded-br-2xl"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;