"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  Trophy, 
  Layers, 
  Lightbulb, 
  HelpCircle,
  QrCode,
  User,
  Clock,
  CheckCircle
} from "lucide-react";

export default function HelpPage() {
  const t = useTranslations("help");

  return (
    <div className="help-page">
      <header className="help-header">
        <Link href="/" className="back-link">
          <ArrowLeft size={20} />
          {t("backToHome")}
        </Link>
        <Link href="/" className="brand">
          <Image src="/logo.webp" alt="YouthConnect" width={40} height={40} className="logo sm" />
          <span className="brand-text">YouthConnect</span>
        </Link>
      </header>

      <main className="help-content">
        <h1 className="help-title">{t("title")}</h1>
        <p className="help-subtitle">{t("subtitle")}</p>

        {/* For Host Section */}
        <section className="help-section">
          <div className="section-header">
            <Monitor size={32} className="section-icon" />
            <h2>{t("forHost.title")}</h2>
          </div>
          <p className="section-intro">{t("forHost.intro")}</p>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>{t("forHost.step1.title")}</h3>
              <p>{t("forHost.step1.description")}</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>{t("forHost.step2.title")}</h3>
              <p>{t("forHost.step2.description")}</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>{t("forHost.step3.title")}</h3>
              <p>{t("forHost.step3.description")}</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>{t("forHost.step4.title")}</h3>
              <p>{t("forHost.step4.description")}</p>
            </div>
            <div className="step-card">
              <div className="step-number">5</div>
              <h3>{t("forHost.step5.title")}</h3>
              <p>{t("forHost.step5.description")}</p>
            </div>
            <div className="step-card">
              <div className="step-number">6</div>
              <h3>{t("forHost.step6.title")}</h3>
              <p>{t("forHost.step6.description")}</p>
            </div>
          </div>
        </section>

        {/* For Player Section */}
        <section className="help-section">
          <div className="section-header">
            <Smartphone size={32} className="section-icon" />
            <h2>{t("forPlayer.title")}</h2>
          </div>
          <p className="section-intro">{t("forPlayer.intro")}</p>
          
          <div className="steps-grid compact">
            <div className="step-card">
              <QrCode size={24} className="step-icon" />
              <h3>{t("forPlayer.step1.title")}</h3>
              <p>{t("forPlayer.step1.description")}</p>
            </div>
            <div className="step-card">
              <User size={24} className="step-icon" />
              <h3>{t("forPlayer.step2.title")}</h3>
              <p>{t("forPlayer.step2.description")}</p>
            </div>
            <div className="step-card">
              <Clock size={24} className="step-icon" />
              <h3>{t("forPlayer.step3.title")}</h3>
              <p>{t("forPlayer.step3.description")}</p>
            </div>
            <div className="step-card">
              <CheckCircle size={24} className="step-icon" />
              <h3>{t("forPlayer.step4.title")}</h3>
              <p>{t("forPlayer.step4.description")}</p>
            </div>
            <div className="step-card full-width">
              <Trophy size={24} className="step-icon" />
              <h3>{t("forPlayer.step5.title")}</h3>
              <p>{t("forPlayer.step5.description")}</p>
            </div>
          </div>
        </section>

        {/* Scoring Section */}
        <section className="help-section">
          <div className="section-header">
            <Trophy size={32} className="section-icon" />
            <h2>{t("scoring.title")}</h2>
          </div>
          <p className="section-intro">{t("scoring.description")}</p>
          
          <div className="scoring-grid">
            <div className="scoring-item correct">
              <span className="scoring-emoji">✅</span>
              <span>{t("scoring.correct")}</span>
            </div>
            <div className="scoring-item speed">
              <span className="scoring-emoji">⚡</span>
              <span>{t("scoring.speed")}</span>
            </div>
            <div className="scoring-item wrong">
              <span className="scoring-emoji">❌</span>
              <span>{t("scoring.wrong")}</span>
            </div>
            <div className="scoring-item practice">
              <span className="scoring-emoji">🎯</span>
              <span>{t("scoring.practice")}</span>
            </div>
          </div>
        </section>

        {/* Difficulty Levels */}
        <section className="help-section">
          <div className="section-header">
            <Layers size={32} className="section-icon" />
            <h2>{t("levels.title")}</h2>
          </div>
          
          <div className="levels-grid">
            <div className="level-card easy">
              <h3>{t("levels.easy.title")}</h3>
              <p>{t("levels.easy.description")}</p>
            </div>
            <div className="level-card medium">
              <h3>{t("levels.medium.title")}</h3>
              <p>{t("levels.medium.description")}</p>
            </div>
            <div className="level-card hard">
              <h3>{t("levels.hard.title")}</h3>
              <p>{t("levels.hard.description")}</p>
            </div>
            <div className="level-card mixed">
              <h3>{t("levels.mixed.title")}</h3>
              <p>{t("levels.mixed.description")}</p>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="help-section">
          <div className="section-header">
            <Lightbulb size={32} className="section-icon" />
            <h2>{t("tips.title")}</h2>
          </div>
          
          <ul className="tips-list">
            <li>{t("tips.tip1")}</li>
            <li>{t("tips.tip2")}</li>
            <li>{t("tips.tip3")}</li>
            <li>{t("tips.tip4")}</li>
          </ul>
        </section>

        {/* Troubleshooting */}
        <section className="help-section">
          <div className="section-header">
            <HelpCircle size={32} className="section-icon" />
            <h2>{t("troubleshooting.title")}</h2>
          </div>
          
          <div className="faq-list">
            <details className="faq-item">
              <summary>{t("troubleshooting.q1.q")}</summary>
              <p>{t("troubleshooting.q1.a")}</p>
            </details>
            <details className="faq-item">
              <summary>{t("troubleshooting.q2.q")}</summary>
              <p>{t("troubleshooting.q2.a")}</p>
            </details>
            <details className="faq-item">
              <summary>{t("troubleshooting.q3.q")}</summary>
              <p>{t("troubleshooting.q3.a")}</p>
            </details>
            <details className="faq-item">
              <summary>{t("troubleshooting.q4.q")}</summary>
              <p>{t("troubleshooting.q4.a")}</p>
            </details>
          </div>
        </section>

        {/* CTA */}
        <section className="help-cta">
          <Link href="/play/host" className="btn btn-primary btn-lg">
            {t("forHost.title")} →
          </Link>
          <Link href="/play" className="btn btn-secondary btn-lg">
            {t("forPlayer.title")} →
          </Link>
        </section>
      </main>
    </div>
  );
}
