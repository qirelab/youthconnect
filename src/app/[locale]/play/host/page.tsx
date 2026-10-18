"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "react-qr-code";
import { getPusherClient, isPusherConfigured } from "@/lib/pusher-client";
import { postHost } from "@/lib/api";
import { generateRandomQuiz, QUESTION_DURATION, REVEAL_DURATION, PRACTICE_INDEX } from "@/lib/quiz-generator";
import {
  CHANNEL,
  EVENTS,
  type JoinRequest,
  type AnswerMessage,
  type Standing,
} from "@/lib/types";
import type { DifficultyLevel } from "@/data/characters";

const LETTERS = ["A", "B", "C", "D"];
const CLASSES = ["a", "b", "c", "d"];

type Phase = "config" | "lobby" | "question" | "reveal" | "ended";

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const rnd = new Uint32Array(5);
  crypto.getRandomValues(rnd);
  for (let i = 0; i < 5; i++) s += chars[rnd[i] % chars.length];
  return s;
}

function points(timeLeft: number, duration: number): number {
  return 500 + Math.round((500 * Math.max(0, timeLeft)) / duration);
}

interface GeneratedQuestion {
  character: string;
  options: string[];
  correct: number;
  image: string;
  visualCue?: string;
}

export default function HostPage() {
  const t = useTranslations("host");
  const g = useTranslations("game");
  const d = useTranslations("difficulty");

  const [gameId, setGameId] = useState("");
  const [origin, setOrigin] = useState("");
  const [phase, setPhase] = useState<Phase>("config");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "mixed">("easy");
  const [questionsCount, setQuestionsCount] = useState(10);
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [current, setCurrent] = useState<{ i: number; endsAt: number } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [revealCorrect, setRevealCorrect] = useState<number | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [answerCount, setAnswerCount] = useState(0);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [practiceQuestion, setPracticeQuestion] = useState<GeneratedQuestion | null>(null);

  const playersRef = useRef<Map<string, string>>(new Map());
  const answersRef = useRef<Record<string, { answer: number; timeLeft: number }>>({});
  const scoresRef = useRef<Map<string, Standing>>(new Map());
  const currentIndexRef = useRef(-1);
  const phaseRef = useRef<Phase>("config");
  const runRef = useRef(0);
  const nextRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    setGameId(genCode());
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = origin && gameId ? `${origin}/play?game=${gameId}` : "";

  useEffect(() => {
    if (!gameId || !isPusherConfigured()) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(CHANNEL(gameId));

    channel.bind(EVENTS.joinRequest, (req: JoinRequest) => {
      const { tempId, name } = req;
      const existing = playersRef.current;

      if (existing.has(tempId)) {
        postHost(gameId, EVENTS.joinResult, { tempId, ok: true });
        return;
      }
      if (phaseRef.current !== "lobby") {
        postHost(gameId, EVENTS.joinResult, { tempId, ok: false, error: "closed" });
        return;
      }
      const lower = name.trim().toLowerCase();
      for (const nm of existing.values()) {
        if (nm.trim().toLowerCase() === lower) {
          postHost(gameId, EVENTS.joinResult, { tempId, ok: false, error: "name-taken" });
          return;
        }
      }
      existing.set(tempId, name);
      setPlayers(Array.from(existing, ([id, n]) => ({ id, name: n })));
      postHost(gameId, EVENTS.joinResult, { tempId, ok: true });
    });

    channel.bind(EVENTS.answer, (a: AnswerMessage) => {
      if (phaseRef.current !== "question") return;
      if (a.index !== currentIndexRef.current) return;
      if (answersRef.current[a.playerId]) return;
      answersRef.current[a.playerId] = { answer: a.answer, timeLeft: a.timeLeft };
      setAnswerCount(Object.keys(answersRef.current).length);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHANNEL(gameId));
    };
  }, [gameId]);

  useEffect(() => {
    if ((phase !== "question" && phase !== "reveal") || !current) return;
    const tick = () => setRemaining(Math.max(0, (current.endsAt - Date.now()) / 1000));
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [phase, current]);

  const computeStandings = useCallback((qIndex: number): Standing[] => {
    const q = questions[qIndex];
    if (!q) return [];
    for (const [id, ans] of Object.entries(answersRef.current)) {
      const s = scoresRef.current.get(id);
      if (!s) continue;
      if (ans.answer === q.correct) {
        s.score += points(ans.timeLeft, QUESTION_DURATION);
        s.correct += 1;
      }
    }
    return Array.from(scoresRef.current.values()).sort((a, b) => b.score - a.score);
  }, [questions]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const openLobby = useCallback(() => {
    // Generate random questions when opening lobby
    const { questions: qs, practice } = generateRandomQuiz(
      difficulty === "mixed" ? undefined : difficulty,
      questionsCount
    );
    setQuestions(qs);
    setPracticeQuestion(practice);
    setPhase("lobby");
  }, [difficulty, questionsCount]);

  const start = useCallback(async () => {
    if (questions.length === 0 || players.length === 0) return;
    const myRun = ++runRef.current;

    scoresRef.current = new Map();
    for (const [id, name] of playersRef.current) {
      scoresRef.current.set(id, { id, name, score: 0, correct: 0 });
    }

    await postHost(gameId, EVENTS.gameStarted, { total: questions.length });

    const rounds = practiceQuestion ? [PRACTICE_INDEX] : [];
    for (let i = 0; i < questions.length; i++) rounds.push(i);

    for (const i of rounds) {
      if (runRef.current !== myRun) return;
      const practice = i === PRACTICE_INDEX;
      const q = practice ? practiceQuestion! : questions[i];

      currentIndexRef.current = i;
      answersRef.current = {};
      setAnswerCount(0);
      const endsAt = Date.now() + QUESTION_DURATION * 1000;
      setRevealCorrect(null);
      setCurrent({ i, endsAt });
      setPhase("question");

      await postHost(gameId, EVENTS.question, {
        index: i,
        total: questions.length,
        type: "selfie",
        q: g("whoMadeSelfie"),
        emoji: null,
        image: q.image,
        options: q.options,
        endsAt,
        duration: QUESTION_DURATION,
        practice,
      });

      await sleep(QUESTION_DURATION * 1000);
      if (runRef.current !== myRun) return;

      const board = practice ? [] : computeStandings(i);
      setStandings(board);
      setRevealCorrect(q.correct);
      setPhase("reveal");
      await postHost(gameId, EVENTS.reveal, { index: i, correct: q.correct, standings: board, practice });

      if (practice) {
        await new Promise<void>((resolve) => {
          nextRef.current = resolve;
        });
      } else {
        const revealEndsAt = Date.now() + REVEAL_DURATION * 1000;
        setCurrent({ i, endsAt: revealEndsAt });
        await sleep(REVEAL_DURATION * 1000);
      }
      if (runRef.current !== myRun) return;
    }

    const finalBoard = Array.from(scoresRef.current.values()).sort((a, b) => b.score - a.score);
    setStandings(finalBoard);
    setPhase("ended");
    await postHost(gameId, EVENTS.ended, { standings: finalBoard });
  }, [questions, practiceQuestion, players.length, gameId, computeStandings, g]);

  const goNext = useCallback(() => {
    const resolve = nextRef.current;
    nextRef.current = null;
    resolve?.();
  }, []);

  const restart = useCallback(() => {
    runRef.current++;
    goNext();
    playersRef.current = new Map();
    scoresRef.current = new Map();
    answersRef.current = {};
    setPlayers([]);
    setStandings([]);
    setCurrent(null);
    setQuestions([]);
    setPracticeQuestion(null);
    setGameId(genCode());
    setPhase("config");
  }, [goNext]);

  const pusherOk = isPusherConfigured();
  const isPractice = current?.i === PRACTICE_INDEX;
  const curQuestion = current
    ? isPractice
      ? practiceQuestion
      : questions[current.i]
    : null;
  const autoNextText = current?.i === questions.length - 1 ? g("resultsIn") : g("nextIn");

  return (
    <div className="wrap">
      {!pusherOk && (
        <div className="error" style={{ marginBottom: 16 }}>
          ⚠ {t("noPusher")}
        </div>
      )}
      <div className="host-top">
        <div className="brand">
          <img src="/logo.webp" alt="YouthConnect" className="logo sm" />
          <span className="title" style={{ fontSize: 22, margin: 0 }}>{t("title")}</span>
        </div>
        <div className="flex">
          {gameId && <span className="pill">{g("code")}: {gameId}</span>}
          {players.length > 0 && <span className="pill">{g("players")}: {players.length}</span>}
          {(phase === "ended" || phase === "reveal" || phase === "question") && (
            <button className="btn" style={{ fontSize: 16, padding: "8px 16px" }} onClick={restart}>
              {t("newGame")}
            </button>
          )}
        </div>
      </div>

      {/* DIFFICULTY SELECTION */}
      {phase === "config" && (
        <div>
          <p className="subtitle">{t("selectQuiz")}</p>
          <div className="quiz-grid">
            {(["easy", "medium", "hard", "mixed"] as const).map((lvl) => (
              <button
                key={lvl}
                className={`quiz-tile ${difficulty === lvl ? "sel" : ""}`}
                onClick={() => setDifficulty(lvl)}
              >
                <span className={`badge ${lvl === "mixed" ? "selfie" : lvl === "easy" ? "text" : "selfie"}`}>
                  {d(lvl).toUpperCase()}
                </span>
                <h3>{d(lvl)}</h3>
                <p>
                  {lvl === "easy" && "Моисей, Давид, Ной, Мария…"}
                  {lvl === "medium" && "Исайя, Варнава, Тит…"}
                  {lvl === "hard" && "Ахитофел, Епафрас, Нимфа…"}
                  {lvl === "mixed" && "4 лёгких + 4 средних + 2 сложных"}
                </p>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <label style={{ display: "block", marginBottom: 8 }}>
              Вопросов: {questionsCount}
            </label>
            <input
              type="range"
              min={5}
              max={20}
              step={5}
              value={questionsCount}
              onChange={(e) => setQuestionsCount(Number(e.target.value))}
              style={{ width: "100%", maxWidth: 300 }}
            />
          </div>
          <div className="flex" style={{ marginTop: 24 }}>
            <button className="btn" onClick={openLobby} disabled={!pusherOk}>
              {t("openLobby")} →
            </button>
          </div>
        </div>
      )}

      {/* LOBBY WITH QR */}
      {phase === "lobby" && (
        <div className="center" style={{ minHeight: "70vh" }}>
          <h1 className="title">{d(difficulty)}</h1>
          <p className="subtitle">{t("scanQR")}</p>
          {joinUrl && (
            <div className="qr-box">
              <QRCode value={joinUrl} size={240} />
            </div>
          )}
          <div className="join-url">{joinUrl}</div>

          <div className="players">
            {players.length === 0 ? (
              <span className="muted">{t("noPlayers")}</span>
            ) : (
              players.map((p) => <span key={p.id} className="chip">{p.name}</span>)
            )}
          </div>

          <div className="flex" style={{ marginTop: 28 }}>
            <button className="btn" onClick={start} disabled={!pusherOk || players.length === 0}>
              ▶ {practiceQuestion ? t("startPractice") : t("startGame")} ({players.length})
            </button>
            <button
              className="btn"
              style={{ background: "rgba(48,48,48,0.8)", color: "var(--mist)", border: "1px solid rgba(240,240,255,0.15)" }}
              onClick={() => setPhase("config")}
            >
              ← {t("back")}
            </button>
          </div>
        </div>
      )}

      {/* QUESTION / REVEAL */}
      {(phase === "question" || phase === "reveal") && curQuestion && (
        <div className="center" style={{ minHeight: "78vh" }}>
          <div className="flex" style={{ width: "100%", justifyContent: "space-between" }}>
            {isPractice ? (
              <span className="pill practice">{g("practice")} · {g("practiceNote")}</span>
            ) : (
              <span className="pill">{g("question")} {current!.i + 1} / {questions.length}</span>
            )}
            {phase === "question" ? (
              <span className={`timer ${remaining <= 5 ? "low" : ""}`}>{Math.ceil(remaining)}</span>
            ) : (
              <span className="pill">{g("answered")}: {answerCount} / {players.length}</span>
            )}
          </div>

          {phase === "reveal" && (
            <h1 className="big-question selfie-q">
              {g("itIs")} <span className="hero-name">{curQuestion.options[revealCorrect ?? curQuestion.correct]}</span>!
            </h1>
          )}
          <img
            className={`selfie-img big ${phase === "reveal" ? "revealed" : ""} ${phase === "reveal" && isPractice ? "with-btn" : ""}`}
            src={curQuestion.image}
            alt="Selfie"
          />

          {phase === "reveal" && isPractice && (
            <p className="subtitle" style={{ marginTop: 26 }}>
              {t("practiceComplete")}
            </p>
          )}

          {phase === "reveal" && isPractice && (
            <button className="btn next-btn" onClick={goNext}>
              {t("startQuiz")} ▶
            </button>
          )}

          {phase === "reveal" && !isPractice && (
            <p className="subtitle auto-next">
              {autoNextText} {Math.max(1, Math.ceil(remaining))} {g("seconds")}…
            </p>
          )}
        </div>
      )}

      {/* FINAL RESULTS */}
      {phase === "ended" && (
        <div className="center" style={{ minHeight: "78vh" }}>
          <div className="result-big">🏆</div>
          <h1 className="title">{t("results")}</h1>
          <div className="board">
            {standings.map((s, i) => {
              const cls = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
              return (
                <div key={s.id} className={`row ${cls}`}>
                  <span className="rank">{medal}</span>
                  <span className="nm">{s.name}</span>
                  <span className={`sc ${i < 3 ? "dark" : ""}`}>
                    {s.score} · {s.correct}/{questions.length}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex" style={{ marginTop: 28 }}>
            <button className="btn" onClick={restart}>{t("newGame")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
