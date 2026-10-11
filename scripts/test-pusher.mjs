import Pusher from "pusher";
import { readFile } from "node:fs/promises";

const env = Object.fromEntries(
  (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.NEXT_PUBLIC_PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

try {
  const res = await pusher.trigger("quiz-TEST", "ping", { hello: "world" });
  console.log("OK — Pusher принял событие, статус:", res.status);
} catch (e) {
  console.error("ОШИБКА Pusher:", e.message || e);
  process.exit(1);
}
