// Общие типы данных для викторины.

export type QuizType = "text" | "selfie";

export interface Question {
  /** Текст вопроса (для текстовых викторин). У селфи формируется автоматически. */
  q?: string;
  character?: string;
  options: string[];
  correct: number;
  emoji?: string;
  image?: string;
  scene?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  type: QuizType;
  questions: Question[];
}

/** Вариант вопроса, который безопасно отправлять игрокам (без правильного ответа). */
export interface PublicQuestion {
  index: number;
  total: number;
  type: QuizType;
  q: string;
  emoji?: string;
  image?: string;
  options: string[];
  endsAt: number; // Date.now() + длительность, мс
  duration: number; // секунды
}

export interface Player {
  id: string;
  name: string;
}

export interface Standing {
  id: string;
  name: string;
  score: number;
  correct: number;
}

// ── События в канале Pusher `quiz-{gameId}` ────────────────────────────────

/** Игрок → ведущий: запрос на вход (ждёт проверки уникальности имени). */
export interface JoinRequest {
  tempId: string;
  name: string;
}

/** Ведущий → игрок: результат проверки входа. */
export interface JoinResult {
  tempId: string;
  ok: boolean;
  error?: "name-taken" | "closed";
}

/** Игрок → ведущий: ответ на вопрос. */
export interface AnswerMessage {
  playerId: string;
  name: string;
  index: number;
  answer: number;
  timeLeft: number; // сек, сколько оставалось при ответе
}

/** Ведущий → все: вопрос начался. */
export interface QuestionMessage extends PublicQuestion {}

/** Ведущий → все: показ правильного ответа. */
export interface RevealMessage {
  index: number;
  correct: number;
  standings: Standing[];
}

/** Ведущий → все: игра завершена, финальный рейтинг. */
export interface EndMessage {
  standings: Standing[];
}

export const CHANNEL = (gameId: string) => `quiz-${gameId}`;

export const EVENTS = {
  joinRequest: "join-request",
  joinResult: "join-result",
  playerJoined: "player-joined",
  gameStarted: "game-started",
  question: "question",
  answer: "answer",
  reveal: "reveal",
  ended: "ended",
  resetLobby: "reset-lobby",
} as const;
