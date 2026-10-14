"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Users, Zap, Trophy, Smartphone, Gift, Globe } from "lucide-react";

const SAMPLE_SELFIES = [
  { src: "/images/selfie/s01.webp", alt: "Adam" },
  { src: "/images/selfie/s09.webp", alt: "Moses" },
  { src: "/images/selfie/s22.webp", alt: "David" },
  { src: "/images/selfie/s32.webp", alt: "Daniel" },
  { src: "/images/selfie/s38.webp", alt: "Mary" },
  { src: "/images/selfie/s41.webp", alt: "Jesus" },
];

export default function LandingPage() {
  const t = useTranslations("landing");
  const nav = useTranslations("nav");
  const diff = useTranslations("difficulty");

  return (
    <div className="landing">
      {/* Navigation */}
      <header className="landing-nav">
        <Link href="/" className="brand">
          <Image src="/logo.webp" alt="YouthConnect" width={48} height={48} className="logo sm" />
          <span className="brand-text">YouthConnect</span>
        </Link>
        <nav className="nav-links">
          <Link href="/play/host" className="nav-link">{nav("host")}</Link>
          <Link href="#donate" className="nav-link">{nav("donate")}</Link>
          <Link href="/auth/signin" className="btn-outline">{nav("signIn")}</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">{t("hero.title")}</h1>
          <p className="hero-subtitle">{t("hero.subtitle")}</p>
          <p className="hero-description">{t("hero.description")}</p>
          <div className="hero-cta">
            <Link href="/play/host" className="btn btn-primary btn-lg">
              {t("hero.ctaHost")} <ChevronRight size={20} />
            </Link>
            <Link href="/play" className="btn btn-secondary btn-lg">
              {t("hero.ctaJoin")}
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="selfie-grid">
            {SAMPLE_SELFIES.slice(0, 4).map((img, i) => (
              <div key={i} className={`selfie-preview selfie-${i}`}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={180}
                  height={180}
                  className="selfie-img"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-it-works">
        <h2 className="section-title">{t("howItWorks.title")}</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>{t("howItWorks.step1.title")}</h3>
            <p>{t("howItWorks.step1.description")}</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>{t("howItWorks.step2.title")}</h3>
            <p>{t("howItWorks.step2.description")}</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>{t("howItWorks.step3.title")}</h3>
            <p>{t("howItWorks.step3.description")}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section features">
        <h2 className="section-title">{t("features.title")}</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon"><Users size={32} /></div>
            <h3>{t("features.selfie.title")}</h3>
            <p>{t("features.selfie.description")}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Zap size={32} /></div>
            <h3>{t("features.realtime.title")}</h3>
            <p>{t("features.realtime.description")}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Trophy size={32} /></div>
            <h3>{t("features.levels.title")}</h3>
            <p>{t("features.levels.description")}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Smartphone size={32} /></div>
            <h3>{t("features.noSignup.title")}</h3>
            <p>{t("features.noSignup.description")}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Gift size={32} /></div>
            <h3>{t("features.free.title")}</h3>
            <p>{t("features.free.description")}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Globe size={32} /></div>
            <h3>{t("features.mobile.title")}</h3>
            <p>{t("features.mobile.description")}</p>
          </div>
        </div>
      </section>

      {/* Difficulty Levels */}
      <section className="section levels">
        <h2 className="section-title">{t("levels.title")}</h2>
        <div className="level-cards">
          <div className="level-card level-easy">
            <div className="level-badge">{diff("easy")}</div>
            <h3>{t("levels.easy.title")}</h3>
            <p>{t("levels.easy.description")}</p>
            <div className="level-count">~60 {nav("profile") ? "героев" : "characters"}</div>
          </div>
          <div className="level-card level-medium">
            <div className="level-badge">{diff("medium")}</div>
            <h3>{t("levels.medium.title")}</h3>
            <p>{t("levels.medium.description")}</p>
            <div className="level-count">~100 {nav("profile") ? "героев" : "characters"}</div>
          </div>
          <div className="level-card level-hard">
            <div className="level-badge">{diff("hard")}</div>
            <h3>{t("levels.hard.title")}</h3>
            <p>{t("levels.hard.description")}</p>
            <div className="level-count">~100 {nav("profile") ? "героев" : "characters"}</div>
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section className="section for-whom">
        <h2 className="section-title">{t("forWhom.title")}</h2>
        <div className="use-cases">
          <div className="use-case">{t("forWhom.youth")}</div>
          <div className="use-case">{t("forWhom.sunday")}</div>
          <div className="use-case">{t("forWhom.camps")}</div>
          <div className="use-case">{t("forWhom.family")}</div>
          <div className="use-case">{t("forWhom.small")}</div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section gallery">
        <h2 className="section-title">{t("gallery.title")}</h2>
        <p className="gallery-hint">{t("gallery.hint")}</p>
        <div className="gallery-grid">
          {SAMPLE_SELFIES.map((img, i) => (
            <div key={i} className="gallery-item">
              <Image
                src={img.src}
                alt="Bible character selfie"
                width={200}
                height={200}
                className="gallery-img"
              />
              <div className="gallery-blur">?</div>
            </div>
          ))}
        </div>
      </section>

      {/* Donate */}
      <section id="donate" className="section donate">
        <h2 className="section-title">{t("donate.title")}</h2>
        <p className="donate-description">{t("donate.description")}</p>
        <div className="donate-options">
          <a href={process.env.NEXT_PUBLIC_STRIPE_DONATE_LINK || "#"} className="donate-card" target="_blank" rel="noopener noreferrer">
            <div className="donate-icon">💳</div>
            <h3>{t("donate.oneTime")}</h3>
            <p>Stripe / Card</p>
          </a>
          <a href={process.env.NEXT_PUBLIC_PAYPAL_DONATE_LINK || "#"} className="donate-card" target="_blank" rel="noopener noreferrer">
            <div className="donate-icon">🅿️</div>
            <h3>PayPal</h3>
            <p>PayPal.me</p>
          </a>
          <a href={process.env.NEXT_PUBLIC_BOOSTY_LINK || "#"} className="donate-card" target="_blank" rel="noopener noreferrer">
            <div className="donate-icon">🚀</div>
            <h3>{t("donate.boosty")}</h3>
            <p>Boosty</p>
          </a>
          <a href={process.env.NEXT_PUBLIC_CRYPTO_LINK || "#"} className="donate-card" target="_blank" rel="noopener noreferrer">
            <div className="donate-icon">₿</div>
            <h3>{t("donate.crypto")}</h3>
            <p>USDT / BTC</p>
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq">
        <h2 className="section-title">{t("faq.title")}</h2>
        <div className="faq-list">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <details key={i} className="faq-item">
              <summary>{t(`faq.q${i}.q`)}</summary>
              <p>{t(`faq.q${i}.a`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Image src="/logo.webp" alt="YouthConnect" width={64} height={64} className="logo" />
            <p>YouthConnect Bible Quiz</p>
          </div>
          <div className="footer-links">
            <h4>{t("footer.contact")}</h4>
            <a href={`mailto:${t("footer.email")}`}>{t("footer.email")}</a>
          </div>
          <div className="footer-legal">
            <a href="/privacy">{t("footer.privacy")}</a>
            <a href="/terms">{t("footer.terms")}</a>
          </div>
        </div>
        <div className="footer-copyright">
          {t("footer.copyright")}
        </div>
      </footer>
    </div>
  );
}
