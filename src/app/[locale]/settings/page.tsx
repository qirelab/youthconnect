"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { locales, localeNames, type Locale } from "@/i18n/config";
import type { UserSettingsData } from "@/db/schema";

const QUESTION_TIMES = [10, 15, 20, 30, 60];
const QUESTIONS_PER_QUIZ = [5, 10, 15, 20];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const d = useTranslations("difficulty");
  const nav = useTranslations("nav");
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [settings, setSettings] = useState<UserSettingsData>({
    autoAdvance: true,
    questionTime: 15,
    questionsPerQuiz: 10,
    difficulty: "easy",
    theme: "dark",
    soundEnabled: true,
    soundVolume: 80,
    showExplanation: true,
    showCorrectAnswer: true,
    practiceQuestion: true,
    speedBonus: true,
  });
  
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage for guests, or from server for signed-in users
  useEffect(() => {
    const stored = localStorage.getItem("bq-settings");
    if (stored) {
      try {
        setSettings({ ...settings, ...JSON.parse(stored) });
      } catch {}
    }
    setLoading(false);
  }, []);

  const handleSave = () => {
    localStorage.setItem("bq-settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = <K extends keyof UserSettingsData>(
    key: K,
    value: UserSettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="center">Loading...</div>;
  }

  return (
    <div className="wrap">
      <div className="host-top">
        <div className="brand">
          <Link href="/">
            <Image src="/logo.webp" alt="YouthConnect" width={52} height={52} className="logo sm" />
          </Link>
          <span className="title" style={{ fontSize: 22, margin: 0 }}>{t("title")}</span>
        </div>
        <div className="flex">
          {status === "authenticated" && (
            <Link href="/profile" className="pill">{nav("profile")}</Link>
          )}
        </div>
      </div>

      <div className="settings-grid">
        {/* Auto Advance */}
        <div className="setting-card">
          <label className="setting-label">{t("autoAdvance.label")}</label>
          <div className="setting-options">
            <button
              className={`setting-btn ${settings.autoAdvance ? "active" : ""}`}
              onClick={() => updateSetting("autoAdvance", true)}
            >
              {t("autoAdvance.auto")}
            </button>
            <button
              className={`setting-btn ${!settings.autoAdvance ? "active" : ""}`}
              onClick={() => updateSetting("autoAdvance", false)}
            >
              {t("autoAdvance.manual")}
            </button>
          </div>
        </div>

        {/* Question Time */}
        <div className="setting-card">
          <label className="setting-label">{t("questionTime.label")}</label>
          <div className="setting-options">
            {QUESTION_TIMES.map((time) => (
              <button
                key={time}
                className={`setting-btn ${settings.questionTime === time ? "active" : ""}`}
                onClick={() => updateSetting("questionTime", time)}
              >
                {time} {t("questionTime.seconds")}
              </button>
            ))}
          </div>
        </div>

        {/* Questions Per Quiz */}
        <div className="setting-card">
          <label className="setting-label">{t("questionsPerQuiz.label")}</label>
          <div className="setting-options">
            {QUESTIONS_PER_QUIZ.map((count) => (
              <button
                key={count}
                className={`setting-btn ${settings.questionsPerQuiz === count ? "active" : ""}`}
                onClick={() => updateSetting("questionsPerQuiz", count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="setting-card">
          <label className="setting-label">{t("difficulty.label")}</label>
          <div className="setting-options">
            {(["easy", "medium", "hard", "mixed"] as const).map((diff) => (
              <button
                key={diff}
                className={`setting-btn ${settings.difficulty === diff ? "active" : ""}`}
                onClick={() => updateSetting("difficulty", diff)}
              >
                {d(diff)}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="setting-card">
          <label className="setting-label">{t("theme.label")}</label>
          <div className="setting-options">
            {(["dark", "light", "system"] as const).map((theme) => (
              <button
                key={theme}
                className={`setting-btn ${settings.theme === theme ? "active" : ""}`}
                onClick={() => updateSetting("theme", theme)}
              >
                {t(`theme.${theme}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Sound */}
        <div className="setting-card">
          <label className="setting-label">{t("sound.label")}</label>
          <div className="setting-options">
            <button
              className={`setting-btn ${settings.soundEnabled ? "active" : ""}`}
              onClick={() => updateSetting("soundEnabled", true)}
            >
              {t("sound.enabled")}
            </button>
            <button
              className={`setting-btn ${!settings.soundEnabled ? "active" : ""}`}
              onClick={() => updateSetting("soundEnabled", false)}
            >
              {t("sound.disabled")}
            </button>
          </div>
        </div>

        {/* Toggle Options */}
        <div className="setting-card">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.showCorrectAnswer}
              onChange={(e) => updateSetting("showCorrectAnswer", e.target.checked)}
            />
            <span>{t("showCorrectAnswer.label")}</span>
          </label>
        </div>

        <div className="setting-card">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.showExplanation}
              onChange={(e) => updateSetting("showExplanation", e.target.checked)}
            />
            <span>{t("showExplanation.label")}</span>
          </label>
        </div>

        <div className="setting-card">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.practiceQuestion}
              onChange={(e) => updateSetting("practiceQuestion", e.target.checked)}
            />
            <span>{t("practiceQuestion.label")}</span>
          </label>
        </div>

        <div className="setting-card">
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={settings.speedBonus}
              onChange={(e) => updateSetting("speedBonus", e.target.checked)}
            />
            <span>{t("speedBonus.label")}</span>
          </label>
        </div>

        {/* Language */}
        <div className="setting-card full-width">
          <label className="setting-label">{t("language.label")}</label>
          <select
            className="setting-select"
            value={typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "ru" : "ru"}
            onChange={(e) => {
              const newLocale = e.target.value;
              const currentPath = window.location.pathname;
              const pathParts = currentPath.split("/");
              if (locales.includes(pathParts[1] as Locale)) {
                pathParts[1] = newLocale;
              } else {
                pathParts.splice(1, 0, newLocale);
              }
              window.location.href = pathParts.join("/");
            }}
          >
            {locales.map((locale) => (
              <option key={locale} value={locale}>
                {localeNames[locale]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex" style={{ marginTop: 32 }}>
        <button className="btn" onClick={handleSave}>
          {saved ? `✓ ${t("saved")}` : t("save")}
        </button>
        <Link href="/play/host" className="btn" style={{ background: "rgba(48,48,48,0.8)", color: "var(--mist)" }}>
          ← {nav("host")}
        </Link>
      </div>
    </div>
  );
}
