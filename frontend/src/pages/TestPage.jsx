import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-black mb-4">
          Тестовая страница работает! ✅
        </h1>
        <p className="text-gray-600 mb-4">
          Frontend успешно запущен на порту 3000
        </p>
        <div className="space-y-2">
          <p><strong>Backend:</strong> http://localhost:8000</p>
          <p><strong>Frontend:</strong> http://localhost:3000</p>
        </div>
        <div className="mt-6">
          <a 
            href="/login" 
            className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800 transition"
          >
            Перейти на страницу входа
</a>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
