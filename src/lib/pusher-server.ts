import Pusher from "pusher";
import { cleanEnv } from "./env";

// Серверный клиент Pusher — используется только в API-роутах (secret не попадает в браузер).
let instance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (instance) return instance;

  const appId = cleanEnv(process.env.PUSHER_APP_ID);
  const key = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_KEY);
  const secret = cleanEnv(process.env.PUSHER_SECRET);
  const cluster = cleanEnv(process.env.NEXT_PUBLIC_PUSHER_CLUSTER);

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      "Не заданы переменные окружения Pusher (PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER)."
    );
  }

  instance = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return instance;
}
