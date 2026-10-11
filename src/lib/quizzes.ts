import data from "@/data/quizzes.json";
import type { Quiz, Question } from "./types";

export const QUIZZES = data.quizzes as Quiz[];

export function getQuiz(id: string): Quiz | undefined {
  return QUIZZES.find((q) => q.id === id);
}

/** Длительность ответа на один вопрос, сек. */
export const QUESTION_DURATION = 15;

/** Сколько показывается правильный ответ перед автопереходом, сек. */
export const REVEAL_DURATION = 5;

/** Индекс пробного вопроса в событиях question/answer/reveal. */
export const PRACTICE_INDEX = -1;


/** Текст, который видит игрок/экран для конкретного вопроса. */
export function questionPrompt(quiz: Quiz, question: Question): string {
  if (quiz.type === "selfie") return "Кто сделал это селфи?";
  return question.q ?? "";
}
