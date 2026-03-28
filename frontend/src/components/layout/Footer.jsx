import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

import googlePlayImg from "@/assets/google-play.png";
import appStoreImg from "@/assets/app-store.png";
import telegramImg from "@/assets/telegram.png";
import instagramImg from "@/assets/instagram.png";
import visaImg from "@/assets/visa.png";
import mastercardImg from "@/assets/mastercard.png";

const corporateLinks = [
  { label: "О нас", href: "#" },
  { label: "Наши магазины", href: "#" },
  { label: "Карьера в MT", href: "#" },
  { label: "Корпоративная поддержка", href: "#" },
];

const legalLinks = [
  { label: "Конфиденциальность", href: "#" },
  { label: "Условия использования", href: "#" },
  { label: "Политика в области охраны труда", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50 mt-12">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Corporate */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Корпоративная информация
            </h3>
            <ul className="space-y-2">
              {corporateLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Юридические документы
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* App */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Скачать наше приложение
            </h3>
            <div className="flex gap-2">
              <Link to="/external?type=google-play">
                <img src={googlePlayImg} alt="Google Play" className="h-10 w-auto rounded" loading="lazy" />
              </Link>
              <Link to="/external?type=app-store">
                <img src={appStoreImg} alt="App Store" className="h-10 w-auto rounded" loading="lazy" />
              </Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Подписывайтесь на нас
            </h3>
            <div className="flex gap-3">
              <Link to="/external?type=telegram">
                <img src={telegramImg} alt="Telegram" className="h-9 w-9 rounded-full" loading="lazy" />
              </Link>
              <Link to="/external?type=instagram">
                <img src={instagramImg} alt="Instagram" className="h-9 w-9 rounded-lg" loading="lazy" />
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Payment */}
        <div className="flex items-center justify-center gap-4">
          <img src={visaImg} alt="Visa" className="h-8 w-auto" loading="lazy" />
          <img src={mastercardImg} alt="MasterCard" className="h-8 w-auto" loading="lazy" />
        </div>
      </div>
    </footer>
  );
}