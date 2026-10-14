"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface GameHistory {
  id: string;
  date: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  score: number;
  correct: number;
  total: number;
  rank: number;
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const d = useTranslations("difficulty");
  const nav = useTranslations("nav");
  const { data: session, status } = useSession();
  
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    correctAnswers: 0,
    bestRank: 0,
  });

  // Load history from localStorage for now
  useEffect(() => {
    const stored = localStorage.getItem("bq-history");
    if (stored) {
      try {
        const data = JSON.parse(stored) as GameHistory[];
        setHistory(data);
        
        // Calculate stats
        const gamesPlayed = data.length;
        const totalScore = data.reduce((sum, g) => sum + g.score, 0);
        const correctAnswers = data.reduce((sum, g) => sum + g.correct, 0);
        const bestRank = Math.min(...data.map(g => g.rank).filter(r => r > 0), 999);
        
        setStats({
          gamesPlayed,
          totalScore,
          correctAnswers,
          bestRank: bestRank === 999 ? 0 : bestRank,
        });
      } catch {}
    }
  }, []);

  if (status === "loading") {
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
          <Link href="/settings" className="pill">{nav("settings")}</Link>
        </div>
      </div>

      {session?.user && (
        <div className="profile-header">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "Avatar"}
              width={80}
              height={80}
              className="profile-avatar"
            />
          )}
          <div className="profile-info">
            <h1>{session.user.name}</h1>
            <p>{session.user.email}</p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.gamesPlayed}</div>
          <div className="stat-label">{t("gamesPlayed")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalScore}</div>
          <div className="stat-label">{t("totalScore")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.correctAnswers}</div>
          <div className="stat-label">{t("correctAnswers")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.bestRank > 0 ? `#${stats.bestRank}` : "—"}</div>
          <div className="stat-label">{t("bestRank")}</div>
        </div>
      </div>

      <h2 className="title" style={{ fontSize: 24 }}>{t("recentGames")}</h2>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <div className="emoji-big" style={{ fontSize: 64 }}>🎮</div>
          <p className="subtitle">{t("noGames")}</p>
          <Link href="/play/host" className="btn" style={{ marginTop: 16 }}>
            {nav("host")} →
          </Link>
        </div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>{t("date")}</th>
              <th>{t("difficulty")}</th>
              <th>{t("score")}</th>
              <th>{t("rank")}</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 20).map((game) => (
              <tr key={game.id}>
                <td>{new Date(game.date).toLocaleDateString()}</td>
                <td>
                  <span className={`badge-difficulty ${game.difficulty}`}>
                    {d(game.difficulty)}
                  </span>
                </td>
                <td>{game.score} ({game.correct}/{game.total})</td>
                <td>#{game.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex" style={{ marginTop: 32 }}>
        <Link href="/play/host" className="btn">
          {nav("host")} →
        </Link>
        <Link href="/" className="btn" style={{ background: "rgba(48,48,48,0.8)", color: "var(--mist)" }}>
          ← {nav("play")}
        </Link>
      </div>
    </div>
  );
}
