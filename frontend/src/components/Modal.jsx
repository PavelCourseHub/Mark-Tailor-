import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'OK', cancelText = 'Отмена' }) => {
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
          <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
            className="flex-1 py-3 text-center font-semibold text-black hover:bg-gray-50 transition rounded-bl-2xl"
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

export default Modal;