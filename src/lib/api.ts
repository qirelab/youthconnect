"use client";

// Обёртки над API-роутами, которые пробрасывают события в Pusher.

export async function postJoin(gameId: string, tempId: string, name: string) {
  return fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, tempId, name }),
  });
}

export async function postAnswer(payload: {
  gameId: string;
  playerId: string;
  name: string;
  index: number;
  answer: number;
  timeLeft: number;
}) {
  return fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function postHost(gameId: string, event: string, data: unknown) {
  const res = await fetch("/api/host", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, event, data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }
  return res;
}
