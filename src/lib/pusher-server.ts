import Pusher from "pusher";

// Серверный клиент Pusher — используется только в API-роутах (secret не попадает в браузер).
let instance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (instance) return instance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      "Не заданы переменные окружения Pusher (PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER)."
    );
  }

  instance = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return instance;
}
