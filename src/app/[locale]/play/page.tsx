"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("player");
  const g = useTranslations("game");

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
        setError(t("errors.nameTaken"));
      } else {
        setError(t("errors.gameClosed"));
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
  }, [gameId, t]);

  useEffect(() => {
    if (phase !== "question" && phase !== "answered") return;
    if (!question) return;
    const tick = () => {
      const left = Math.max(0, (question.endsAt - Date.now()) / 1000);
      setRemaining(left);
    };
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [phase, question]);

  const submitName = useCallback(async () => {
    const n = name.trim();
    if (n.length < 2) {
      setError(t("errors.nameMin"));
      return;
    }
    setError("");
    setChecking(true);
    nameRef.current = n;
    try {
      await postJoin(gameId, tempIdRef.current, n);
      setTimeout(() => {
        setChecking((c) => {
          if (c) setError(t("errors.hostOffline"));
          return false;
        });
      }, 6000);
    } catch {
      setChecking(false);
      setError(t("errors.network"));
    }
  }, [name, gameId, t]);

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

  if (!gameId) {
    return (
      <div className="center">
        <div className="card" style={{ maxWidth: 420 }}>
          <img src="/logo.webp" alt="YouthConnect" className="logo" />
          <h1 className="title">{g("code")}</h1>
          <p className="subtitle">{t("scanQR")}</p>
        </div>
      </div>
    );
  }

  if (phase === "name") {
    return (
      <div className="center">
        <div className="card" style={{ maxWidth: 440, width: "100%" }}>
          <img src="/logo.webp" alt="YouthConnect" className="logo" />
          <h1 className="title">{t("enterName")}</h1>
          <p className="subtitle">{g("code")}: {gameId}</p>
          <input
            className="name"
            placeholder={t("namePlaceholder")}
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitName()}
            autoFocus
          />
          <button className="btn block" onClick={submitName} disabled={checking}>
            {checking ? t("checking") : t("join")}
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
        <h1 className="title">{t("youAreIn")}, {nameRef.current}!</h1>
        <p className="subtitle">{g("waitingHost")}</p>
      </div>
    );
  }

  if (phase === "question" || phase === "answered") {
    const timeUp = remaining <= 0;
    const locked = picked !== null || timeUp;
    return (
      <div className="center" style={{ justifyContent: "flex-start", paddingTop: 20 }}>
        <div className="flex" style={{ width: "100%", justifyContent: "space-between" }}>
          {question?.practice ? (
            <span className="pill practice">{g("practice")}</span>
          ) : (
            <span className="pill">{g("question")} {question ? question.index + 1 : 0} {g("of")} {question?.total ?? 0}</span>
          )}
          <span className="pill">{Math.ceil(remaining)} {g("seconds")}</span>
        </div>
        <div className="bar" style={{ maxWidth: 560 }}>
          <span style={{ width: `${(remaining / (question?.duration ?? 15)) * 100}%` }} />
        </div>
        {locked ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="emoji-big">{picked !== null ? "✅" : "⌛"}</div>
            <h2 className="title" style={{ fontSize: 30 }}>
              {picked !== null ? `${g("answerAccepted")}` : g("timeout")}
            </h2>
            {picked !== null && question?.options[picked] && (
              <p className="subtitle picked-name">{LETTERS[picked]}: {question.options[picked]}</p>
            )}
            <p className="subtitle">{g("lookAtScreen")}</p>
          </div>
        ) : (
          <div className="phone-answers" style={{ marginTop: 18 }}>
            {(question?.options ?? ["", "", "", ""]).map((opt, i) => (
              <button
                key={i}
                className={`phone-answer ${CLASSES[i]}`}
                onClick={() => choose(i)}
              >
                <span className="letter">{LETTERS[i]}</span>
                {opt && <span className="opt">{opt}</span>}
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
          {correct ? g("correct") : picked === null ? g("noAnswer") : g("incorrect")}
        </h1>
        {!correct && question?.options[reveal.correct] && (
          <p className="subtitle">
            {g("correctAnswer")}: <b>{LETTERS[reveal.correct]} — {question.options[reveal.correct]}</b>
          </p>
        )}
        {reveal.practice && (
          <p className="subtitle">
            {g("practice")} — {g("practiceNote")}
          </p>
        )}
        {me && (
          <p className="subtitle">
            {g("points")}: <b>{me.score}</b> · {g("correctAnswers")}: <b>{me.correct}</b> · {g("place")}: <b>{place}</b>
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
          {place > 0 ? `${place} ${g("place")}` : g("timeout")}
        </h1>
        {me && (
          <p className="subtitle">
            {me.name}, {me.score} {g("points")} · {me.correct} {g("correctAnswers")}!
          </p>
        )}
      </div>
    );
  }

  return null;
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="center">Loading…</div>}>
      <PlayerApp />
    </Suspense>
  );
}
