import { useState, useEffect } from 'react';

const SizeTable = ({ category, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(category || 'women');
  const [activeTab, setActiveTab] = useState('clothing'); // clothing или shoes

  // Данные для таблиц размеров
  const sizeTables = {
    women: {
      clothing: {
        title: 'Таблица размеров для женщин (см)',
        headers: ['Размер', 'Грудь', 'Талия', 'Бедра', 'Длина по внутреннему шву'],
        rows: [
          { size: '34-XS', chest: 82, waist: 66, hips: 90, inseam: 86 },
          { size: '36-S', chest: 86, waist: 70, hips: 94, inseam: 86 },
          { size: '38-M', chest: 90, waist: 74, hips: 98, inseam: 86 },
          { size: '40-L', chest: 94, waist: 78, hips: 102, inseam: 86 },
          { size: '42-XL', chest: 99, waist: 83, hips: 107, inseam: 86 },
          { size: '44-XXL', chest: 104, waist: 88, hips: 112, inseam: 86 },
          { size: '46-3XL', chest: 109, waist: 93, hips: 117, inseam: 86 },
          { size: '48-4XL', chest: 114, waist: 98, hips: 122, inseam: 86 },
          { size: '50-5XL', chest: 119, waist: 103, hips: 127, inseam: 86 },
        ],
      },
      shoes: {
        title: 'Таблица размеров обуви для женщин',
        headers: ['TR/EUR', 'UK', 'US', 'см'],
        rows: [
          { eu: 35, uk: 2.5, us: 4, cm: 22 },
          { eu: 36, uk: 3, us: 4.5, cm: 22.7 },
          { eu: 37, uk: 4, us: 5.5, cm: 23.7 },
          { eu: 38, uk: 5, us: 6.5, cm: 24 },
          { eu: 39, uk: 6, us: 7.5, cm: 24.7 },
          { eu: 40, uk: 6.5, us: 8, cm: 25.3 },
        ],
      },
    },
    men: {
      clothing: {
        title: 'Таблица размеров для мужчин (см)',
        headers: ['Размер', 'Грудь', 'Талия', 'Бедра', 'Длина по внутреннему шву'],
        rows: [
          { size: 'XS', chest: 92, waist: 82, hips: 90, inseam: 84 },
          { size: 'S', chest: 96, waist: 86, hips: 96, inseam: 84 },
          { size: 'M', chest: 100, waist: 90, hips: 102, inseam: 84 },
          { size: 'L', chest: 104, waist: 94, hips: 108, inseam: 84 },
          { size: 'XL', chest: 110, waist: 100, hips: 114, inseam: 84 },
          { size: 'XXL', chest: 118, waist: 108, hips: 120, inseam: 84 },
          { size: '3XL', chest: 126, waist: 116, hips: 126, inseam: 84 },
          { size: '4XL', chest: 134, waist: 124, hips: 132, inseam: 84 },
        ],
      },
      shoes: {
        title: 'Таблица размеров обуви для мужчин',
        headers: ['TR/EUR', 'UK', 'US', 'см'],
        rows: [
          { eu: 38, uk: 5, us: 6.5, cm: 24 },
          { eu: 39, uk: 6, us: 7.5, cm: 24.7 },
          { eu: 40, uk: 6.5, us: 8, cm: 25.3 },
          { eu: 41, uk: 7.5, us: 9, cm: 26 },
          { eu: 42, uk: 8, us: 9.5, cm: 26.7 },
          { eu: 43, uk: 9, us: 10.5, cm: 27.3 },
          { eu: 44, uk: 9.5, us: 11, cm: 28 },
          { eu: 45, uk: 10.5, us: 12, cm: 28.7 },
          { eu: 46, uk: 11.5, us: 13, cm: 29.3 },
        ],
      },
    },
    girls: {
      clothing: {
        title: 'Таблица размеров для девочек (см)',
        headers: ['Возраст', 'Рост', 'Грудь', 'Талия', 'Длина ноги'],
        rows: [
          { age: '3-4 года', height: 104, chest: 56, waist: 54, inseam: 60 },
          { age: '4-5 лет', height: 110, chest: 58, waist: 55, inseam: 62 },
          { age: '5-6 лет', height: 116, chest: 60, waist: 56, inseam: 64 },
          { age: '6-7 лет', height: 122, chest: 62.5, waist: 57, inseam: 66 },
          { age: '7-8 лет', height: 128, chest: 65, waist: 58, inseam: 70 },
          { age: '8-9 лет', height: 134, chest: 68, waist: 59.5, inseam: 74 },
          { age: '9-10 лет', height: 140, chest: 71, waist: 61, inseam: 76 },
          { age: '10-11 лет', height: 146, chest: 74, waist: 63, inseam: 80 },
          { age: '11-12 лет', height: 152, chest: 77, waist: 65, inseam: 84 },
        ],
      },
    },
    boys: {
      clothing: {
        title: 'Таблица размеров для мальчиков (см)',
        headers: ['Возраст', 'Рост', 'Грудь', 'Талия', 'Длина ноги'],
        rows: [
          { age: '3-4 года', height: 104, chest: 56, waist: 54, inseam: 60 },
          { age: '4-5 лет', height: 110, chest: 58, waist: 55, inseam: 62 },
          { age: '5-6 лет', height: 116, chest: 60, waist: 56, inseam: 64 },
          { age: '6-7 лет', height: 122, chest: 62.5, waist: 57, inseam: 66 },
          { age: '7-8 лет', height: 128, chest: 65, waist: 59, inseam: 68 },
          { age: '8-9 лет', height: 134, chest: 68, waist: 61, inseam: 71 },
          { age: '9-10 лет', height: 140, chest: 71, waist: 63, inseam: 75 },
          { age: '10-11 лет', height: 146, chest: 74.5, waist: 65.5, inseam: 78 },
          { age: '11-12 лет', height: 152, chest: 78, waist: 68, inseam: 82 },
        ],
      },
    },
    babies: {
      clothing: {
        title: 'Таблица размеров для малышей (см)',
        headers: ['Возраст', 'Рост', 'Вес', 'Грудь', 'Талия', 'Длина ноги'],
        rows: [
          { age: 'Новорожденные', height: 50, weight: 3, chest: '-', waist: '-', inseam: '-' },
          { age: '0-1 месяц', height: 56, weight: '3-4.5', chest: '-', waist: '-', inseam: '-' },
          { age: '1-3 месяца', height: 62, weight: '4.5-6.5', chest: 43, waist: 43, inseam: 42 },
          { age: '3-6 месяцев', height: 68, weight: '6.5-8', chest: 45.5, waist: 45, inseam: 44.75 },
          { age: '6-9 месяцев', height: 74, weight: '8-9', chest: 47, waist: 46.5, inseam: 47.5 },
          { age: '9-12 месяцев', height: 80, weight: '9-10', chest: 49.5, waist: 48.75, inseam: 50 },
          { age: '12-18 месяцев', height: 86, weight: '10-11', chest: 50.75, waist: 49.75, inseam: 51.5 },
          { age: '18-24 месяцев', height: 92, weight: '11-12.5', chest: 52.5, waist: 50.5, inseam: 53 },
          { age: '24-36 месяцев', height: 98, weight: '12.5-14.5', chest: 54.25, waist: 52.5, inseam: 56 },
        ],
      },
    },
  };

  const currentData = sizeTables[selectedCategory] || sizeTables.women;

  // Функция для измерения размера
  const getSizeGuide = () => {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Как определить свой размер?</h4>
        <ul className="space-y-3 text-sm text-gray-600">
          <li>
            <span className="font-medium">1. Грудь:</span> Расположите сантиметровую ленту через самые выступающие точки груди и измерьте свой объём.
          </li>
          <li>
            <span className="font-medium">2. Талия:</span> Обхват талии измеряется строго горизонтально по самой узкой части тела.
          </li>
          <li>
            <span className="font-medium">3. Бёдра:</span> При измерении обхвата бедер лента должна находиться горизонтально, проходя сзади по наиболее выступающим точкам ягодиц.
          </li>
          <li>
            <span className="font-medium">4. Длина ноги по внутреннему шву:</span> Измерение соответствует расстоянию по внутренней стороне ноги от паха до лодыжки.
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Таблица размеров</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs for categories */}
        <div className="px-6 pt-4 border-b">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('women')}
              className={`px-4 py-2 rounded-t-lg transition ${
                selectedCategory === 'women'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Женщины
            </button>
            <button
              onClick={() => setSelectedCategory('men')}
              className={`px-4 py-2 rounded-t-lg transition ${
                selectedCategory === 'men'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Мужчины
            </button>
            <button
              onClick={() => setSelectedCategory('girls')}
              className={`px-4 py-2 rounded-t-lg transition ${
                selectedCategory === 'girls'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Девочки
            </button>
            <button
              onClick={() => setSelectedCategory('boys')}
              className={`px-4 py-2 rounded-t-lg transition ${
                selectedCategory === 'boys'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Мальчики
            </button>
            <button
              onClick={() => setSelectedCategory('babies')}
              className={`px-4 py-2 rounded-t-lg transition ${
                selectedCategory === 'babies'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Малыши
            </button>
          </div>
        </div>

        {/* Tabs for clothing/shoes */}
        {selectedCategory !== 'babies' && (
          <div className="px-6 pt-4 border-b">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('clothing')}
                className={`pb-2 transition ${
                  activeTab === 'clothing'
                    ? 'border-b-2 border-black text-black font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Одежда
              </button>
              <button
                onClick={() => setActiveTab('shoes')}
                className={`pb-2 transition ${
                  activeTab === 'shoes'
                    ? 'border-b-2 border-black text-black font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Обувь
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentData[activeTab]?.title}
          </h3>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {currentData[activeTab]?.headers.map((header, idx) => (
                    <th key={idx} className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData[activeTab]?.rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.values(row).map((value, valIdx) => (
                      <td key={valIdx} className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Size guide */}
          {getSizeGuide()}
        </div>
      </div>
    </div>
  );
};

export default SizeTable;