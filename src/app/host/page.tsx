"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  QUIZZES,
  getQuiz,
  QUESTION_DURATION,
  PRACTICE_INDEX,
  questionPrompt,
} from "@/lib/quizzes";
import { getPusherClient, isPusherConfigured } from "@/lib/pusher-client";
import { postHost } from "@/lib/api";
import {
  CHANNEL,
  EVENTS,
  type JoinRequest,
  type AnswerMessage,
  type Standing,
} from "@/lib/types";

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

function shuffleInPlace(a: number[]): void {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function points(timeLeft: number, duration: number): number {
  return 500 + Math.round((500 * Math.max(0, timeLeft)) / duration);
}

export default function HostPage() {
  const [gameId, setGameId] = useState("");
  const [origin, setOrigin] = useState("");
  const [phase, setPhase] = useState<Phase>("config");
  const [selectedId, setSelectedId] = useState<string>("");
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [current, setCurrent] = useState<{ i: number; endsAt: number } | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [revealCorrect, setRevealCorrect] = useState<number | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [answerCount, setAnswerCount] = useState(0);

  const playersRef = useRef<Map<string, string>>(new Map());
  const answersRef = useRef<Record<string, { answer: number; timeLeft: number }>>({});
  const scoresRef = useRef<Map<string, Standing>>(new Map());
  const currentIndexRef = useRef(-1);
  const phaseRef = useRef<Phase>("config");
  const runRef = useRef(0);
  // после показа ответа игра ждёт, пока ведущий нажмёт «Далее»
  const nextRef = useRef<(() => void) | null>(null);
  const orderRef = useRef<number[]>([]);

  const quiz = useMemo(() => getQuiz(selectedId), [selectedId]);
  const total = quiz?.questions.length ?? 0;

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // создать код игры и определить адрес для QR
  useEffect(() => {
    setGameId(genCode());
    setOrigin(window.location.origin);
  }, []);

  const joinUrl = origin && gameId ? `${origin}/?game=${gameId}` : "";

  // подписка на канал
  useEffect(() => {
    if (!gameId || !isPusherConfigured()) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(CHANNEL(gameId));

    channel.bind(EVENTS.joinRequest, (req: JoinRequest) => {
      const { tempId, name } = req;
      const existing = playersRef.current;

      // реконнект того же игрока — всегда пускаем
      if (existing.has(tempId)) {
        postHost(gameId, EVENTS.joinResult, { tempId, ok: true });
        return;
      }
      // лобби ещё не открыто или игра уже идёт
      if (phaseRef.current !== "lobby") {
        postHost(gameId, EVENTS.joinResult, { tempId, ok: false, error: "closed" });
        return;
      }
      // проверка уникальности имени (без учёта регистра)
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
      if (answersRef.current[a.playerId]) return; // засчитываем первый ответ
      answersRef.current[a.playerId] = { answer: a.answer, timeLeft: a.timeLeft };
      setAnswerCount(Object.keys(answersRef.current).length);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHANNEL(gameId));
    };
  }, [gameId]);

  // таймер
  useEffect(() => {
    if (phase !== "question" || !current) return;
    const tick = () => setRemaining(Math.max(0, (current.endsAt - Date.now()) / 1000));
    tick();
    const t = setInterval(tick, 100);
    return () => clearInterval(t);
  }, [phase, current]);

  const computeStandings = useCallback((qIndex: number): Standing[] => {
    const q = quiz!.questions[qIndex];
    for (const [id, ans] of Object.entries(answersRef.current)) {
      const s = scoresRef.current.get(id);
      if (!s) continue;
      if (ans.answer === q.correct) {
        s.score += points(ans.timeLeft, QUESTION_DURATION);
        s.correct += 1;
      }
    }
    return Array.from(scoresRef.current.values()).sort((a, b) => b.score - a.score);
  }, [quiz]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const openLobby = useCallback(() => {
    if (!quiz) return;
    setPhase("lobby");
  }, [quiz]);

  const start = useCallback(async () => {
    if (!quiz || players.length === 0) return;
    const myRun = ++runRef.current;

    // инициализация очков для всех вошедших игроков
    scoresRef.current = new Map();
    for (const [id, name] of playersRef.current) {
      scoresRef.current.set(id, { id, name, score: 0, correct: 0 });
    }

    await postHost(gameId, EVENTS.gameStarted, { total });

    // Селфи-викторины: порядок героев случайный в каждой игре.
    // i — номер шага (его видят игроки), orderRef[i] — индекс вопроса в викторине.
    const order = Array.from({ length: total }, (_, k) => k);
    if (quiz.type === "selfie") shuffleInPlace(order);
    orderRef.current = order;

    // Пробный вопрос (индекс -1) идёт первым и не влияет на очки.
    const rounds = quiz.practice ? [PRACTICE_INDEX] : [];
    for (let i = 0; i < total; i++) rounds.push(i);

    for (const i of rounds) {
      if (runRef.current !== myRun) return;
      const practice = i === PRACTICE_INDEX;
      const q = practice ? quiz.practice! : quiz.questions[order[i]];

      currentIndexRef.current = i;
      answersRef.current = {};
      setAnswerCount(0);
      const endsAt = Date.now() + QUESTION_DURATION * 1000;
      setRevealCorrect(null);
      setCurrent({ i, endsAt });
      setPhase("question");

      await postHost(gameId, EVENTS.question, {
        index: i,
        total,
        type: quiz.type,
        q: questionPrompt(quiz, q),
        emoji: q.emoji ?? null,
        image: q.image ?? null,
        options: q.options,
        endsAt,
        duration: QUESTION_DURATION,
        practice,
      });

      await sleep(QUESTION_DURATION * 1000);
      if (runRef.current !== myRun) return;

      const board = practice ? [] : computeStandings(order[i]);
      setStandings(board);
      setRevealCorrect(q.correct);
      setPhase("reveal");
      await postHost(gameId, EVENTS.reveal, { index: i, correct: q.correct, standings: board, practice });

      await new Promise<void>((resolve) => {
        nextRef.current = resolve;
      });
      if (runRef.current !== myRun) return;
    }

    const finalBoard = Array.from(scoresRef.current.values()).sort((a, b) => b.score - a.score);
    setStandings(finalBoard);
    setPhase("ended");
    await postHost(gameId, EVENTS.ended, { standings: finalBoard });
  }, [quiz, players.length, total, gameId, computeStandings]);

  const goNext = useCallback(() => {
    const resolve = nextRef.current;
    nextRef.current = null;
    resolve?.();
  }, []);

  const restart = useCallback(() => {
    runRef.current++;
    goNext(); // отпустить ожидающий цикл — он выйдет по runRef
    playersRef.current = new Map();
    scoresRef.current = new Map();
    answersRef.current = {};
    setPlayers([]);
    setStandings([]);
    setCurrent(null);
    setGameId(genCode());
    setPhase("config");
  }, [goNext]);

  // ── Рендер ────────────────────────────────────────────────

  const isPractice = current?.i === PRACTICE_INDEX;
  const curQuestion =
    quiz && current
      ? isPractice
        ? quiz.practice ?? null
        : quiz.questions[orderRef.current[current.i] ?? current.i]
      : null;
  const isSelfie = quiz?.type === "selfie" && !!curQuestion?.image;
  const nextLabel = isPractice
    ? "Начать викторину ▶"
    : current?.i === total - 1
      ? "Показать итоги 🏆"
      : "Следующий вопрос ▶";

  return (
    <div className="wrap">
      {!isPusherConfigured() && (
        <div className="error" style={{ marginBottom: 16 }}>
          ⚠ Не заданы ключи Pusher. Добавьте переменные окружения
          (NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER, PUSHER_APP_ID,
          PUSHER_SECRET) — см. README. Без них real-time не работает.
        </div>
      )}
      <div className="host-top">
        <div className="brand">
          <img src="/logo.webp" alt="Connect youth" className="logo sm" />
          <span className="title" style={{ fontSize: 22, margin: 0 }}>Библейская викторина</span>
        </div>
        <div className="flex">
          {gameId && <span className="pill">Код: {gameId}</span>}
          {players.length > 0 && <span className="pill">Игроков: {players.length}</span>}
          {(phase === "ended" || phase === "reveal" || phase === "question") && (
            <button className="btn" style={{ fontSize: 16, padding: "8px 16px" }} onClick={restart}>
              Новая игра
            </button>
          )}
        </div>
      </div>

      {/* ВЫБОР ВИКТОРИНЫ */}
      {phase === "config" && (
        <div>
          <p className="subtitle">Выберите викторину и откройте лобби для участников.</p>
          <div className="quiz-grid">
            {QUIZZES.map((qz) => (
              <button
                key={qz.id}
                className={`quiz-tile ${selectedId === qz.id ? "sel" : ""}`}
                onClick={() => setSelectedId(qz.id)}
              >
                <span className={`badge ${qz.type}`}>
                  {qz.type === "selfie" ? "СЕЛФИ" : "ВОПРОСЫ"}
                </span>
                <h3>{qz.title}</h3>
                <p>{qz.description}</p>
                <p style={{ marginTop: 8, opacity: 0.6 }}>{qz.questions.length} вопросов</p>
              </button>
            ))}
          </div>
          <div className="flex" style={{ marginTop: 24 }}>
            <button className="btn" onClick={openLobby} disabled={!quiz}>
              Открыть лобби →
            </button>
          </div>
        </div>
      )}

      {/* ЛОББИ С QR */}
      {phase === "lobby" && (
        <div className="center" style={{ minHeight: "70vh" }}>
          <h1 className="title">{quiz?.title}</h1>
          <p className="subtitle">Отсканируйте QR-код телефоном, чтобы присоединиться</p>
          {joinUrl && (
            <div className="qr-box">
              <QRCode value={joinUrl} size={240} />
            </div>
          )}
          <div className="join-url">{joinUrl}</div>

          <div className="players">
            {players.length === 0 ? (
              <span className="muted">Пока никто не присоединился…</span>
            ) : (
              players.map((p) => <span key={p.id} className="chip">{p.name}</span>)
            )}
          </div>

          <div className="flex" style={{ marginTop: 28 }}>
            <button className="btn" onClick={start} disabled={players.length === 0}>
              ▶ {quiz?.practice ? "Начать с пробного вопроса" : "Начать викторину"} ({players.length})
            </button>
            <button
              className="btn"
              style={{ background: "rgba(48,48,48,0.8)", color: "var(--mist)", border: "1px solid rgba(240,240,255,0.15)" }}
              onClick={() => setPhase("config")}
            >
              ← Назад
            </button>
          </div>
        </div>
      )}

      {/* ВОПРОС / ПОКАЗ ОТВЕТА */}
      {(phase === "question" || phase === "reveal") && curQuestion && quiz && (
        <div className="center" style={{ minHeight: "78vh" }}>
          <div className="flex" style={{ width: "100%", justifyContent: "space-between" }}>
            {isPractice ? (
              <span className="pill practice">Пробный вопрос · без очков</span>
            ) : (
              <span className="pill">Вопрос {current!.i + 1} / {total}</span>
            )}
            {phase === "question" ? (
              <span className={`timer ${remaining <= 5 ? "low" : ""}`}>{Math.ceil(remaining)}</span>
            ) : (
              <span className="pill">Ответили: {answerCount} из {players.length}</span>
            )}
          </div>

          {isSelfie ? (
            <>
              {/* Селфи: на экране только фото, варианты — на телефонах.
                  Имя героя появляется только при показе ответа. */}
              {phase === "reveal" && (
                <h1 className="big-question selfie-q">
                  Это <span className="hero-name">{curQuestion.options[revealCorrect ?? curQuestion.correct]}</span>!
                </h1>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={`selfie-img big ${phase === "reveal" ? "revealed" : ""}`}
                src={curQuestion.image}
                alt="Селфи героя"
              />
            </>
          ) : (
            <>
              <h1 className="big-question">{questionPrompt(quiz, curQuestion)}</h1>
              <div className="emoji-big">{curQuestion.emoji ?? "📖"}</div>
            </>
          )}

          {!isSelfie && (
          <div className="answers" style={{ maxWidth: 900, marginTop: 24 }}>
            {curQuestion.options.map((opt, i) => {
              const isCorrect = phase === "reveal" && i === revealCorrect;
              const dim = phase === "reveal" && i !== revealCorrect;
              return (
                <div key={i} className={`answer ${CLASSES[i]} ${dim ? "dim" : ""} ${isCorrect ? "picked" : ""}`}>
                  <span className="letter">{LETTERS[i]}</span>
                  <span>{opt}</span>
                  {isCorrect && <span style={{ marginLeft: "auto", fontSize: "1.4em" }}>✔</span>}
                </div>
              );
            })}
          </div>
          )}

          {phase === "reveal" && isPractice && (
            <p className="subtitle" style={{ marginTop: 26 }}>
              Пробный раунд окончен — дальше всё по-настоящему!
            </p>
          )}

          {/* Пауза: следующий вопрос — только по кнопке ведущего */}
          {phase === "reveal" && (
            <button className="btn next-btn" onClick={goNext}>
              {nextLabel}
            </button>
          )}
        </div>
      )}

      {/* ФИНАЛЬНЫЙ РЕЙТИНГ */}
      {phase === "ended" && (
        <div className="center" style={{ minHeight: "78vh" }}>
          <div className="result-big">🏆</div>
          <h1 className="title">Итоги викторины</h1>
          <div className="board">
            {standings.map((s, i) => {
              const cls = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
              return (
                <div key={s.id} className={`row ${cls}`}>
                  <span className="rank">{medal}</span>
                  <span className="nm">{s.name}</span>
                  <span className={`sc ${i < 3 ? "dark" : ""}`}>
                    {s.score} · {s.correct}/{total}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex" style={{ marginTop: 28 }}>
            <button className="btn" onClick={restart}>Новая игра</button>
          </div>
        </div>
      )}
    </div>
  );
}
