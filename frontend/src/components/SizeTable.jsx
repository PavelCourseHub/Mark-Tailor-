import { useState } from 'react';

const SizeTable = ({ category, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(category || 'women');
  const [activeTab, setActiveTab] = useState('clothing');

  const getTableData = () => {
    // Женщины - Одежда
    if (selectedCategory === 'women' && activeTab === 'clothing') {
      return {
        title: 'Таблица размеров для женщин (см)',
        headers: ['Размер', 'Грудь', 'Талия', 'Бедра', 'Длина по внутреннему шву'],
        rows: [
          ['34-XS', 82, 66, 90, 86],
          ['36-S', 86, 70, 94, 86],
          ['38-M', 90, 74, 98, 86],
          ['40-L', 94, 78, 102, 86],
          ['42-XL', 99, 83, 107, 86],
          ['44-XXL', 104, 88, 112, 86],
          ['46-3XL', 109, 93, 117, 86],
          ['48-4XL', 114, 98, 122, 86],
          ['50-5XL', 119, 103, 127, 86],
        ],
        guide: {
          title: 'Как определить свой размер?',
          steps: [
            { name: 'Грудь', description: 'Расположите сантиметровую ленту через самые выступающие точки груди и измерьте свой объём.' },
            { name: 'Талия', description: 'Обхват талии измеряется строго горизонтально по самой узкой части тела, проходя через самую выступающую точку живота.' },
            { name: 'Бёдра', description: 'При измерении обхвата бедер лента должна находиться горизонтально, проходя сзади по наиболее выступающим точкам ягодиц.' },
            { name: 'Длина ноги по внутреннему шву', description: 'Измерение соответствует расстоянию по внутренней стороне ноги от паха до лодыжки.' },
          ],
        },
      };
    }
    
    // Женщины - Обувь
    if (selectedCategory === 'women' && activeTab === 'shoes') {
      return {
        title: 'Таблица размеров обуви для женщин',
        headers: ['TR/EUR', 'UK', 'US', 'см'],
        rows: [
          [35, 2.5, 4, 22],
          [36, 3, 4.5, 22.7],
          [37, 4, 5.5, 23.7],
          [38, 5, 6.5, 24],
          [39, 6, 7.5, 24.7],
          [40, 6.5, 8, 25.3],
        ],
        guide: {
          title: 'Как определить размер обуви?',
          steps: [
            { name: 'Расстояние от пятки до большого пальца', description: 'Поставьте ногу на чистый лист бумаги. Отметьте крайние границы ступни и измерьте расстояние между самыми удаленными точками стопы.' },
            { name: 'Ширина', description: 'Измерьте ширину стопы в самой широкой части. Нога должна быть плотно прижата к полу и параллельна второй ступне.' },
          ],
        },
      };
    }

    // Мужчины - Одежда
    if (selectedCategory === 'men' && activeTab === 'clothing') {
      return {
        title: 'Таблица размеров для мужчин (см)',
        headers: ['Размер', 'Грудь', 'Талия', 'Бедра', 'Длина по внутреннему шву'],
        rows: [
          ['XS', 92, 82, 90, 84],
          ['S', 96, 86, 96, 84],
          ['M', 100, 90, 102, 84],
          ['L', 104, 94, 108, 84],
          ['XL', 110, 100, 114, 84],
          ['XXL', 118, 108, 120, 84],
          ['3XL', 126, 116, 126, 84],
          ['4XL', 134, 124, 132, 84],
        ],
        guide: {
          title: 'Как определить свой размер?',
          steps: [
            { name: 'Грудь', description: 'Расположите сантиметровую ленту через самые выступающие точки груди и измерьте свой объём.' },
            { name: 'Талия', description: 'Обхват талии измеряется строго горизонтально по самой узкой части тела.' },
            { name: 'Бёдра', description: 'При измерении обхвата бедер лента должна находиться горизонтально.' },
            { name: 'Длина ноги по внутреннему шву', description: 'Измерение соответствует расстоянию по внутренней стороне ноги от паха до лодыжки.' },
          ],
        },
      };
    }

    // Мужчины - Обувь
    if (selectedCategory === 'men' && activeTab === 'shoes') {
      return {
        title: 'Таблица размеров обуви для мужчин',
        headers: ['TR/EUR', 'UK', 'US', 'см'],
        rows: [
          [38, 5, 6.5, 24],
          [39, 6, 7.5, 24.7],
          [40, 6.5, 8, 25.3],
          [41, 7.5, 9, 26],
          [42, 8, 9.5, 26.7],
          [43, 9, 10.5, 27.3],
          [44, 9.5, 11, 28],
          [45, 10.5, 12, 28.7],
          [46, 11.5, 13, 29.3],
        ],
        guide: {
          title: 'Как определить размер обуви?',
          steps: [
            { name: 'Расстояние от пятки до большого пальца', description: 'Поставьте ногу на чистый лист бумаги. Отметьте крайние границы ступни и измерьте расстояние между самыми удаленными точками стопы.' },
            { name: 'Ширина', description: 'Измерьте ширину стопы в самой широкой части.' },
          ],
        },
      };
    }

    // Девочки - Одежда
    if (selectedCategory === 'girls' && activeTab === 'clothing') {
      return {
        title: 'Таблица размеров для девочек (см)',
        headers: ['Возраст', 'Рост', 'Грудь', 'Талия', 'Длина по внутреннему шву'],
        rows: [
          ['3-4 года', 104, 56, 54, 60],
          ['4-5 лет', 110, 58, 55, 62],
          ['5-6 лет', 116, 60, 56, 64],
          ['6-7 лет', 122, 62.5, 57, 66],
          ['7-8 лет', 128, 65, 58, 70],
          ['8-9 лет', 134, 68, 59.5, 74],
          ['9-10 лет', 140, 71, 61, 76],
          ['10-11 лет', 146, 74, 63, 80],
          ['11-12 лет', 152, 77, 65, 84],
        ],
        guide: {
          title: 'Как определить свой размер?',
          steps: [
            { name: 'Рост', description: 'Снимите обувь и встаньте спиной к стене. Измерьте расстояние от пола до верхней точки головы.' },
            { name: 'Грудь', description: 'Расположите сантиметровую ленту через самые выступающие точки груди и измерьте свой объём.' },
            { name: 'Талия', description: 'Обхват талии измеряется строго горизонтально по самой узкой части тела.' },
            { name: 'Длина ноги по внутреннему шву', description: 'Измерение соответствует расстоянию по внутренней стороне ноги от паха до лодыжки.' },
          ],
        },
      };
    }

    // Девочки - Обувь
    if (selectedCategory === 'girls' && activeTab === 'shoes') {
      return {
        title: 'Таблица размеров обуви для девочек',
        headers: ['TR/EUR', 'UK', 'US', 'см', 'Возраст'],
        rows: [
          [26, 8.5, 8.5, 16, '0-6 месяцев'],
          [27, 9.5, 9.5, 16.7, '6-12 месяцев'],
          [28, 10, 10, 17.4, '6-12 месяцев'],
          [29, 11, 11, 18, '12-18 месяцев'],
          [30, 11.5, 11.5, 18.7, '12-18 месяцев'],
          [31, 12.5, 12.5, 19.3, '3-10 лет'],
          [32, 13, 13, 20, '3-10 лет'],
          [33, 13.5, 1, 20.7, '3-10 лет'],
          [34, 2, 2, 21.3, '3-10 лет'],
          [35, 2.5, 4, 22, '3-10 лет'],
          [36, 3, 4.5, 22.7, '3-10 лет'],
          [37, 4, 5.5, 23.7, '3-10 лет'],
          [38, 5, 6.5, 24, '3-10 лет'],
        ],
        guide: {
          title: 'Как определить размер обуви?',
          steps: [
            { name: 'Расстояние от пятки до большого пальца', description: 'Поставьте ногу на чистый лист бумаги. Отметьте крайние границы ступни и измерьте расстояние между самыми удаленными точками стопы.' },
            { name: 'Ширина', description: 'Измерьте ширину стопы в самой широкой части.' },
          ],
        },
      };
    }

    // Мальчики - Одежда
    if (selectedCategory === 'boys' && activeTab === 'clothing') {
      return {
        title: 'Таблица размеров для мальчиков (см)',
        headers: ['Возраст', 'Рост', 'Грудь', 'Талия', 'Длина по внутреннему шву'],
        rows: [
          ['3-4 года', 104, 56, 54, 60],
          ['4-5 лет', 110, 58, 55, 62],
          ['5-6 лет', 116, 60, 56, 64],
          ['6-7 лет', 122, 62.5, 57, 66],
          ['7-8 лет', 128, 65, 59, 68],
          ['8-9 лет', 134, 68, 61, 71],
          ['9-10 лет', 140, 71, 63, 75],
          ['10-11 лет', 146, 74.5, 65.5, 78],
          ['11-12 лет', 152, 78, 68, 82],
        ],
        guide: {
          title: 'Как определить свой размер?',
          steps: [
            { name: 'Рост', description: 'Снимите обувь и встаньте спиной к стене. Измерьте расстояние от пола до верхней точки головы.' },
            { name: 'Грудь', description: 'Расположите сантиметровую ленту через самые выступающие точки груди и измерьте свой объём.' },
            { name: 'Талия', description: 'Обхват талии измеряется строго горизонтально по самой узкой части тела.' },
            { name: 'Длина ноги по внутреннему шву', description: 'Измерение соответствует расстоянию по внутренней стороне ноги от паха до лодыжки.' },
          ],
        },
      };
    }

    // Мальчики - Обувь
    if (selectedCategory === 'boys' && activeTab === 'shoes') {
      return {
        title: 'Таблица размеров обуви для мальчиков',
        headers: ['TR/EUR', 'UK', 'US', 'см', 'Возраст'],
        rows: [
          [26, 8.5, 8.5, 16, '0-6 месяцев'],
          [27, 9.5, 9.5, 16.7, '6-12 месяцев'],
          [28, 10, 10, 17.4, '6-12 месяцев'],
          [29, 11, 11, 18, '12-18 месяцев'],
          [30, 11.5, 11.5, 18.7, '12-18 месяцев'],
          [31, 12.5, 12.5, 19.3, '3-10 лет'],
          [32, 13, 13, 20, '3-10 лет'],
          [33, 13.5, 1, 20.7, '3-10 лет'],
          [34, 2, 2, 21.3, '3-10 лет'],
          [35, 2.5, 4, 22, '3-10 лет'],
          [36, 3, 4.5, 22.7, '3-10 лет'],
          [37, 4, 5.5, 23.7, '3-10 лет'],
          [38, 5, 6.5, 24, '3-10 лет'],
        ],
        guide: {
          title: 'Как определить размер обуви?',
          steps: [
            { name: 'Расстояние от пятки до большого пальца', description: 'Поставьте ногу на чистый лист бумаги. Отметьте крайние границы ступни и измерьте расстояние между самыми удаленными точками стопы.' },
            { name: 'Ширина', description: 'Измерьте ширину стопы в самой широкой части.' },
          ],
        },
      };
    }

    // Малыши
    if (selectedCategory === 'babies') {
      return {
        title: 'Таблица размеров для малышей (см)',
        headers: ['Возраст', 'Рост', 'Вес', 'Грудь', 'Талия', 'Длина ноги'],
        rows: [
          ['Новорожденные', 50, 3, '-', '-', '-'],
          ['0-1 месяц', 56, '3-4.5', '-', '-', '-'],
          ['1-3 месяца', 62, '4.5-6.5', 43, 43, 42],
          ['3-6 месяцев', 68, '6.5-8', 45.5, 45, 44.75],
          ['6-9 месяцев', 74, '8-9', 47, 46.5, 47.5],
          ['9-12 месяцев', 80, '9-10', 49.5, 48.75, 50],
          ['12-18 месяцев', 86, '10-11', 50.75, 49.75, 51.5],
          ['18-24 месяцев', 92, '11-12.5', 52.5, 50.5, 53],
          ['24-36 месяцев', 98, '12.5-14.5', 54.25, 52.5, 56],
        ],
        guide: {
          title: 'Как определить размер для малышей?',
          steps: [
            { name: 'Рост', description: 'Снимите обувь и встаньте спиной к стене. Измерьте расстояние от пола до верхней точки головы.' },
            { name: 'Вес', description: 'Взвесьте ребенка на точных весах.' },
            { name: 'Грудь', description: 'Расположите сантиметровую ленту через самые выступающие точки груди.' },
          ],
        },
      };
    }

    return {
      title: 'Таблица размеров',
      headers: ['Размер'],
      rows: [['Нет данных']],
      guide: null,
    };
  };

  const currentData = getTableData();

  const renderCategoryButtons = () => {
    const categories = [
      { id: 'women', label: 'Женщины' },
      { id: 'men', label: 'Мужчины' },
      { id: 'girls', label: 'Девочки' },
      { id: 'boys', label: 'Мальчики' },
      { id: 'babies', label: 'Малыши' },
    ];

    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setActiveTab('clothing');
            }}
            className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    );
  };

  const renderTabs = () => {
    if (selectedCategory === 'babies') return null;
    
    return (
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
    );
  };

  const renderGuide = () => {
    if (!currentData.guide) return null;
    
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">{currentData.guide.title}</h4>
        <div className="space-y-3 text-sm text-gray-600">
          {currentData.guide.steps.map((step, idx) => (
            <p key={idx}>
              <span className="font-medium">{step.name}:</span> {step.description}
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Таблица размеров</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Категории */}
        <div className="px-6 pt-4 border-b">
          {renderCategoryButtons()}
        </div>

        {/* Вкладки Одежда/Обувь */}
        <div className="px-6 pt-4 border-b">
          {renderTabs()}
        </div>

        {/* Таблица */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {currentData.title}
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {currentData.headers.map((header, idx) => (
                    <th key={idx} className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {renderGuide()}
        </div>
      </div>
    </div>
  );
};

export default SizeTable;