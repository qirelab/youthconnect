"use client";

import PusherClient from "pusher-js";

// Браузерный клиент Pusher. Телефоны и экран ведущего подключаются к Pusher
// напрямую — поэтому serverless-ограничение Vercel на WebSocket обходится.
let instance: PusherClient | null = null;

export function isPusherConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  );
}

export function getPusherClient(): PusherClient {
  if (instance) return instance;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    throw new Error(
      "Не заданы NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER."
    );
  }

  instance = new PusherClient(key, { cluster });
  return instance;
}
