import { useState } from "react";
import { Link } from "react-router-dom";

const FaqPage = () => {
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (index) => {
    if (openQuestion === index) {
      setOpenQuestion(null);
    } else {
      setOpenQuestion(index);
    }
  };

  const faqData = [
    {
      question: "Как отменить товар, если ошибся?",
      answer: (
        <div className="space-y-3">
          <p>Сразу после оформления мы передаем заказ на формирование и доставку.</p>
          <p>Отказаться от товара вы сможете в Истории заказов.</p>
          <p>Отказаться от товара вы также сможете при получении. Для этого потребуется:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Назвать последние 4 цифры номера телефона, указанного в личном кабинете.</li>
          </ul>
        </div>
      )
    },
    {
      question: "Куда и когда вернутся деньги за возвращенный товар?",
      answer: (
        <div className="space-y-3">
          <p>После отказа от оплаченного товара или его возврата, денежные средства могут:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Быть перечислены на счет, с которого производилась оплата товара. Производится как правило в день возврата товара. При нестандартной ситуации может занять несколько дней.</li>
          </ul>
          <p>После осуществления возврата, срок зачисления денежных средств на счет зависит от условий банка, в котором открыт счет покупателя.</p>
        </div>
      )
    },
    {
      question: "Как можно оплатить заказ?",
      answer: (
        <div className="space-y-3">
          <p>Оплата заказа осуществляется безналичным способом.</p>
          <p><strong>Все</strong> доступные способы безналичной оплаты указаны в разделе «Корзина» в момент оформления заказа. Они могут изменяться на усмотрение торговой площадки.</p>
        </div>
      )
    },
    {
      question: "Когда поступит заказ?",
      answer: (
        <div className="space-y-3">
          <p>После оформления заказа срок доставки каждого товара примерно 2-3 дня</p>
        </div>
      )
    },
    {
      question: "Доставка товара задерживается. Когда доставят?",
      answer: (
        <div className="space-y-3">
          <p>Мы постараемся доставить его в течение ближайших нескольких дней.</p>
          <p>Если ожидание доставки такого товара не актуально, отменить его в случае длительной задержки доставки можно в разделе «Доставки».</p>
        </div>
      )
    },
    {
      question: "Как изменить способ/адрес доставки?",
      answer: (
        <div className="space-y-3">
          <p>После оформления заказа изменить их нельзя, чтобы избежать ошибок при доставке товаров.</p>
          <p>Это связано с тем, что сразу после оформления заказа, мы передаем его на формирование и доставку.</p>
        </div>
      )
    },
    {
      question: "Как получить заказ, который поступил?",
      answer: (
        <div className="space-y-3">
          <p>Когда заказ поступает в пункт выдачи, в "Истории заказов" ему назначается статус "Доставлен"</p>
          <p>Для получения заказа:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>При самовывозе: забрать товар в пункте выдачи.</li>
            <li>При курьерской доставке: дождитесь курьера по указанному адресу, назовите номер телефона указанный в личном кабинете.</li>
            <li>При себе необходимо иметь документ, удостоверяющий личность.</li>
          </ul>
          <p>Заказ хранится в пункте выдачи 7 дней. После этого он возвращается на склад.</p>
        </div>
      )
    },
    {
      question: "Как восстановить доступ к личному кабинету?",
      answer: (
        <div className="space-y-3">
          <ul className="list-disc pl-6 space-y-1">
            <li>Нажмите «Войти» и "Забыли пароль?"</li>
            <li>Введите адрес электронной почты</li>
            <li>Перейдите по ссылке на почте</li>
            <li>Смените пароль</li>
          </ul>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-black text-white py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/50"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Частые вопросы
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Ответы на самые популярные вопросы о наших товарах и услугах
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Хлебные крошки */}
        <div className="text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-black">Главная страница</Link>
          <span className="mx-2">›</span>
          <span className="text-black">Часто задаваемые вопросы</span>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {faqData.map((item, index) => (
            <div 
              key={index}
              className={`border-b border-gray-200 last:border-b-0 ${
                openQuestion === index ? "bg-gray-50" : ""
              }`}
            >
              {/* Вопрос */}
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <span className="text-lg font-medium text-gray-900">
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openQuestion === index ? "transform rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Ответ */}
              {openQuestion === index && (
                <div className="px-6 pb-6 pt-2 text-gray-700 border-t border-gray-100 bg-gray-50">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaqPage;