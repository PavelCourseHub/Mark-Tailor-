import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const AboutPage = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("history");

  useEffect(() => {
    // Проверяем hash в URL при загрузке
    const hash = location.hash.replace("#", "");
    if (hash && ["history", "achievements", "policy", "quality", "safety", "cookie"].includes(hash)) {
      setActiveSection(hash);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location]);

  const sections = [
    { id: "history", title: "История", icon: "📜" },
    { id: "achievements", title: "Достижения", icon: "🏆" },
    { id: "policy", title: "Корпоративная политика", icon: "📋" },
    { id: "quality", title: "Тесты качества продукции", icon: "🔬" },
    { id: "safety", title: "Безопасность продукции", icon: "🛡️" },
    { id: "cookie", title: "Политика использования файлов cookie", icon: "🍪" },
  ];

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      // Обновляем URL без перезагрузки страницы
      window.history.pushState(null, "", `#${sectionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-black text-white py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Mark Tailor
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Стиль, подчеркивающий вашу индивидуальность
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Хлебные крошки */}
        <div className="text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-black">Главная страница</Link>
          <span className="mx-2">›</span>
          <span className="text-black">О нас</span>
          {activeSection !== "history" && (
            <>
              <span className="mx-2">›</span>
              <span className="text-black">
                {sections.find(s => s.id === activeSection)?.title}
              </span>
            </>
          )}
        </div>

        {/* Боковое меню и контент */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-32">
              <h3 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b">О нас</h3>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        activeSection === section.id
                          ? "bg-black text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="mr-2">{section.icon}</span>
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-12">
            {/* История */}
            <section id="history" className="bg-white rounded-lg shadow-md p-8 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b">История</h2>
              
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  Основная тема партнерами французского происхождения в 1988 году, компания Mark Tailor начала свою 
                  коммерческую деятельность как оптовый бренд. Зарегистрированная в Париже, компания Mark Tailor 
                  привлекла внимание прежде всего дизайном футболок и толстовок. После расставания двух основателей, 
                  Mark Tailor перешла к Джорджу Амуялю в качестве единственного акционера. Компания Tema Tekstil, 
                  входящая в группу Taha и являющаяся производителем и лицензиаром Mark Tailor в Турции, приобрела 
                  всемирные права на бренд Mark Tailor в 1997 году.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  После приобретения всех прав на бренд, название компании Tema Tekstil, принадлежащей Taha Group, 
                  было изменено на "Mark Tailor Retailing Services". 7-процентная доля в группе была передана 
                  Джорджу Амуялю, у которого были выкуплены роялти Mark Tailor. Хотя Джордж Амуял, французского 
                  происхождения, после передачи бренда не принимал активного участия в управлении Mark Tailor, 
                  он по-прежнему владеет 7 процентами нашей компании.
                </p>
              </div>

              {/* Таймлайн */}
              <div className="mt-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">История развития</h3>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 ml-4"></div>
                  <div className="space-y-6">
                    {[
                      { year: "1988", event: "Основание Mark Tailor" },
                      { year: "1997", event: "Приобретение всемирных прав на бренд" },
                      { year: "2000", event: "Открытие первого магазина в Минске" },
                      { year: "2009", event: "25 лет успешной работы" },
                      { year: "2014", event: "Выход на международный рынок" },
                      { year: "2020", event: "Открытие 100-го магазина" },
                    ].map((item, idx) => (
                      <div key={idx} className="relative pl-12">
                        <div className="absolute left-0 top-1 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {item.year}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-800 font-medium">{item.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-6 border-t">
                <div className="text-center">
                  <div className="text-3xl font-bold text-black">5</div>
                  <div className="text-sm text-gray-500">Континентов</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-black">82</div>
                  <div className="text-sm text-gray-500">Стран</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-black">1300+</div>
                  <div className="text-sm text-gray-500">Магазинов</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-black">55 000+</div>
                  <div className="text-sm text-gray-500">Сотрудников</div>
                </div>
              </div>

              {/* 2020 событие */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold text-black">2020</span>
                </div>
                <p className="text-gray-700 font-semibold mb-2">Открылся 1000-й магазин</p>
                <p className="text-gray-600">
                  Компания Mark Tailor, в соответствии со своей миссией, выраженной в девизе 
                  «Каждый заслуживает хорошо одеваться», открыла свой 1000-й магазин в Киеве, столице Украины.
                </p>
              </div>
            </section>

            {/* Достижения */}
            <section id="achievements" className="bg-white rounded-lg shadow-md p-8 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b">Достижения</h2>
              
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-yellow-50 to-transparent rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Компания Mark Tailor стала победителем в двух категориях премии Best Business Awards!
                  </h3>
                  <p className="text-gray-700">
                    Компания Mark Tailor стала победителем в двух категориях премии Best Business Awards!
                  </p>
                  <div className="mt-2 text-sm text-gray-500">2024</div>
                </div>

                <div className="border-l-4 border-black pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Лучший в социальных сетях, Mark Tailor!
                  </h3>
                  <p className="text-gray-600">
                    В рамках партнерства между Marketing Türkiye и BoomSonar, премия Social Media Awards Turkey 
                    выбрала лучших в сфере социальных сетей.
                  </p>
                </div>

                <div className="border-l-4 border-black pl-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    20-я крупнейшая компания в рейтинге
                  </h3>
                  <p className="text-gray-600">
                    В этом году мы поднялись на 20-е место в рейтинге "Capital 500 Research", 
                    в котором ежегодно публикуется список 500 крупнейших компаний.
                  </p>
                </div>
              </div>
            </section>

            {/* Корпоративная политика */}
            <section id="policy" className="bg-white rounded-lg shadow-md p-8 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b">Корпоративная политика</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">НАША МИССИЯ</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Основываясь на убеждении, что «Каждый заслуживает хорошо одеваться», мы стремимся 
                    «дарить нашим клиентам чувство удовлетворения, предлагая товары, соответствующие их 
                    потребностям, стилю и бюджету, в удобной и приятной обстановке для покупок».
                  </p>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">НАШЕ ВИДЕНИЕ</h3>
                  <p className="text-gray-700 leading-relaxed">
                    «Стать одним из трех самых успешных ритейлеров одежды в Европе». Этот успех основан на 
                    показателе рентабельности, удовлетворенности сотрудников, клиентов и поставщиков, 
                    социальной ответственности и принципах устойчивого развития.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Наши ценности</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {["Быть добродетельными", "Достигаем вместе", "Обширный опыт", "Ориентированность на клиента", "Преодоление трудностей"].map((value, idx) => (
                      <div key={idx} className="bg-gray-100 rounded-lg p-3 text-center text-sm font-medium text-gray-800">
                        {value}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Политика качества</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Быть ведущей и образцовой компанией в своем секторе, которая разрабатывает продукцию 
                    в соответствии с потребностями и ожиданиями клиентов, учитывая их стиль и бюджет, 
                    руководствуясь философией «Каждый заслуживает хорошо одеваться»...
                  </p>
                </div>
              </div>
            </section>

            {/* Тесты качества продукции */}
            <section id="quality" className="bg-white rounded-lg shadow-md p-8 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b">Тесты качества продукции</h2>
              
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed">
                  Группа компаний Mark Tailor стремилась предлагать своим клиентам качественную продукцию 
                  по доступным ценам, руководствуясь девизом «Каждый заслуживает хорошо одеваться». 
                  В связи с этим мы провели первые исследования качества при участии нашей профессиональной 
                  команды и внедрили строгие этапы контроля в производственный процесс.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-blue-800 font-semibold">
                    В наших лабораториях мы проводим в среднем 4000 экологических тестов в день.
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    *(Под «экологическими тестами» подразумеваются потенциально опасные химические анализы)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {["Крепость ткани", "Физические испытания", "Анализ волокон"].map((test, idx) => (
                    <div key={idx} className="bg-gray-100 rounded-lg p-4 text-center">
                      <p className="font-medium text-gray-800">{test}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Безопасность продукции */}
            <section id="safety" className="bg-white rounded-lg shadow-md p-8 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b">Безопасность продукции</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 italic p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    В компании Mark Tailor мы придерживаемся принципа предоставления качественной продукции по разумным ценам, 
                    уделяя при этом особое внимание безопасности нашей продукции и здоровью человека, что отражается 
                    в широком ассортименте товаров.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Коллекция одежды из органического хлопка для новорожденных от Mark Tailor
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    В соответствии с принципами безопасности нашей продукции и нашей глубокой заботой о здоровье человека, 
                    мы подготовили капсульную коллекцию из органического хлопка, состоящую из 3 отдельных частей, 
                    для новорожденных, учитывая потребности матерей. Наша коллекция унаследует высококачественные материалы, 
                    которые соответствуют самым строгим стандартам качества.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Безопасность детской одежды</h3>
                  <p className="text-gray-700 leading-relaxed">
                    В целях защиты наших детей от всех видов рисков, связанных с повреждениями ремешков или сборок на подоле, 
                    таких как удушение, сдавливание горла, мы обеспечиваем соблюдение условий безопасности при использовании 
                    детской одежды.
                  </p>
                </div>
              </div>
            </section>

            {/* Политика использования файлов cookie */}
            <section id="cookie" className="bg-white rounded-lg shadow-md p-8 scroll-mt-24">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b">Политика использования файлов cookie</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Уточнение по использованию файлов cookie в отношении обработки персональных данных</p>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    Технологии отслеживания, такие как файлы cookie, пиксели и GIF-файлы («файлы cookie»), представляют собой 
                    небольшие файлы, размещаемые на ваших устройствах, таких как планшеты, телефоны или компьютеры, во время 
                    использования вами онлайн-приложений, таких как веб-сайты или мобильные приложения.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Строго необходимые файлы cookie</h3>
                  <p className="text-gray-700 text-sm">
                    Строго необходимые файлы cookie — это файлы cookie, размещаемые на вашем устройстве во время просмотра 
                    вами Платформы и необходимые для надлежащего функционирования предлагаемых онлайн-сервисов.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Файлы cookie производительности</h3>
                  <p className="text-gray-700 text-sm">
                    Файлы cookie производительности позволяют нам отслеживать и анализировать количество пользователей, 
                    просматривающих платформу, и график платформы. Благодаря этим файлам cookie мы можем получать информацию, 
                    например, о том, какие разделы платформы посещаются чаще всего или реже.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600 text-sm">
                    В соответствии с Законом о защите персональных данных, ваши персональные данные, касающиеся файлов cookie, 
                    используются исключительно для предоставления вам услуг.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;