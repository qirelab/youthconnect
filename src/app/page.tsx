"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPusherClient, isPusherConfigured } from "@/lib/pusher-client";
import { postJoin, postAnswer } from "@/lib/api";
import {
  CHANNEL,
  EVENTS,
  type JoinResult,
  type QuestionMessage,
  type RevealMessage,
  type EndMessage,
  type Standing,
} from "@/lib/types";

const LETTERS = ["A", "B", "C", "D"];
const CLASSES = ["a", "b", "c", "d"];

type Phase = "name" | "waiting" | "question" | "answered" | "reveal" | "ended";

function PlayerApp() {
  const params = useSearchParams();
  const gameId = (params.get("game") || "").toUpperCase();

  const [phase, setPhase] = useState<Phase>("name");
  const [name, setName] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState<QuestionMessage | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState<RevealMessage | null>(null);
  const [finalBoard, setFinalBoard] = useState<Standing[]>([]);
  const [remaining, setRemaining] = useState(0);

  const tempIdRef = useRef<string>("");
  const nameRef = useRef<string>("");
  const pickedRef = useRef<number | null>(null);

  // восстановление идентификатора игрока из localStorage (переживает перезагрузку)
  useEffect(() => {
    if (!gameId) return;
    const key = `bq-player-${gameId}`;
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    tempIdRef.current = id;
    const savedName = localStorage.getItem(`bq-name-${gameId}`);
    if (savedName) setName(savedName);
  }, [gameId]);

  // подписка на канал игры
  useEffect(() => {
    if (!gameId || !isPusherConfigured()) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(CHANNEL(gameId));

    channel.bind(EVENTS.joinResult, (data: JoinResult) => {
      if (data.tempId !== tempIdRef.current) return;
      setChecking(false);
      if (data.ok) {
        localStorage.setItem(`bq-name-${gameId}`, nameRef.current);
        setError("");
        setPhase((p) => (p === "name" ? "waiting" : p));
      } else if (data.error === "name-taken") {
        setError("Это имя уже занято. Выберите другое.");
      } else {
        setError("Игра уже идёт или закрыта для входа.");
      }
    });

    channel.bind(EVENTS.question, (q: QuestionMessage) => {
      setQuestion(q);
      setReveal(null);
      setPicked(null);
      pickedRef.current = null;
      setPhase("question");
    });

    channel.bind(EVENTS.reveal, (r: RevealMessage) => {
      setReveal(r);
      setPhase("reveal");
    });

    channel.bind(EVENTS.ended, (e: EndMessage) => {
      setFinalBoard(e.standings);
      setPhase("ended");
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(CHANNEL(gameId));
    };
  }, [gameId]);

  // таймер обратного отсчёта на основе endsAt
  useEffect(() => {
    if (phase !== "question" && phase !== "answered") return;
    if (!question) return;
    const tick = () => {
      const left = Math.max(0, (question.endsAt - Date.now()) / 1000);
      setRemaining(left);
    };
    tick();
    const t = setInterval(tick, 100);
    return () => clearInterval(t);
  }, [phase, question]);

  const submitName = useCallback(async () => {
    const n = name.trim();
    if (n.length < 2) {
      setError("Введите имя (минимум 2 символа).");
      return;
    }
    setError("");
    setChecking(true);
    nameRef.current = n;
    try {
      await postJoin(gameId, tempIdRef.current, n);
      // ждём join-result от ведущего; таймаут на случай, если ведущий не в сети
      setTimeout(() => {
        setChecking((c) => {
          if (c) setError("Ведущий не отвечает. Убедитесь, что викторина открыта на экране.");
          return false;
        });
      }, 6000);
    } catch {
      setChecking(false);
      setError("Ошибка сети. Попробуйте ещё раз.");
    }
  }, [name, gameId]);

  const choose = useCallback(
    (i: number) => {
      if (!question || pickedRef.current !== null) return;
      if (Date.now() > question.endsAt) return;
      const timeLeft = Math.max(0, (question.endsAt - Date.now()) / 1000);
      pickedRef.current = i;
      setPicked(i);
      setPhase("answered");
      postAnswer({
        gameId,
        playerId: tempIdRef.current,
        name: nameRef.current,
        index: question.index,
        answer: i,
        timeLeft,
      }).catch(() => {});
    },
    [question, gameId]
  );

  // ── Рендер ────────────────────────────────────────────────

  if (!gameId) {
    return (
      <div className="center">
        <div className="card" style={{ maxWidth: 420 }}>
          <h1 className="title">Библейская викторина</h1>
          <p className="subtitle">
            Отсканируйте QR-код на экране, чтобы присоединиться к игре.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "name") {
    return (
      <div className="center">
        <div className="card" style={{ maxWidth: 440, width: "100%" }}>
          <h1 className="title">Как вас зовут?</h1>
          <p className="subtitle">Код игры: {gameId}</p>
          <input
            className="name"
            placeholder="Ваше имя или никнейм"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitName()}
            autoFocus
          />
          <button className="btn block" onClick={submitName} disabled={checking}>
            {checking ? "Проверяем…" : "Войти"}
          </button>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="center">
        <div className="emoji-big">⏳</div>
        <h1 className="title">Вы в игре, {nameRef.current}!</h1>
        <p className="subtitle">Ждём, пока ведущий запустит викторину…</p>
      </div>
    );
  }

  if (phase === "question" || phase === "answered") {
    const timeUp = remaining <= 0;
    const locked = picked !== null || timeUp;
    return (
      <div className="center" style={{ justifyContent: "flex-start", paddingTop: 20 }}>
        <div className="flex" style={{ width: "100%", justifyContent: "space-between" }}>
          <span className="pill">Вопрос {question ? question.index + 1 : 0} из {question?.total ?? 0}</span>
          <span className="pill">{Math.ceil(remaining)} сек</span>
        </div>
        <div className="bar" style={{ maxWidth: 560 }}>
          <span style={{ width: `${(remaining / (question?.duration ?? 15)) * 100}%` }} />
        </div>
        {locked ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="emoji-big">{picked !== null ? "✅" : "⌛"}</div>
            <h2 className="title" style={{ fontSize: 30 }}>
              {picked !== null ? `Ответ ${LETTERS[picked]} принят!` : "Время вышло"}
            </h2>
            <p className="subtitle">Смотрите на главный экран…</p>
          </div>
        ) : (
          <div className="phone-answers" style={{ marginTop: 18 }}>
            {(question?.options ?? [0, 1, 2, 3]).map((_, i) => (
              <button
                key={i}
                className={`phone-answer ${CLASSES[i]}`}
                onClick={() => choose(i)}
              >
                {LETTERS[i]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (phase === "reveal" && reveal) {
    const correct = picked !== null && picked === reveal.correct;
    const me = reveal.standings.find((s) => s.id === tempIdRef.current);
    const place = me ? reveal.standings.findIndex((s) => s.id === me.id) + 1 : 0;
    return (
      <div className="center">
        <div className="result-big">{correct ? "✅" : picked === null ? "⌛" : "❌"}</div>
        <h1 className="title">
          {correct ? "Верно!" : picked === null ? "Не успели" : "Неверно"}
        </h1>
        {me && (
          <p className="subtitle">
            Очки: <b>{me.score}</b> · Правильных: <b>{me.correct}</b> · Место: <b>{place}</b>
          </p>
        )}
      </div>
    );
  }

  if (phase === "ended") {
    const me = finalBoard.find((s) => s.id === tempIdRef.current);
    const place = me ? finalBoard.findIndex((s) => s.id === me.id) + 1 : 0;
    const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : "🎉";
    return (
      <div className="center">
        <div className="result-big">{medal}</div>
        <h1 className="title">
          {place > 0 ? `${place} место` : "Игра окончена"}
        </h1>
        {me && (
          <p className="subtitle">
            {me.name}, у вас <b>{me.score}</b> очков и <b>{me.correct}</b> правильных ответов!
          </p>
        )}
      </div>
    );
  }

  return null;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="center">Загрузка…</div>}>
      <PlayerApp />
    </Suspense>
  );
}
