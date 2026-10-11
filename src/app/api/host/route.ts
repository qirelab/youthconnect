import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { CHANNEL } from "@/lib/types";

// Ведущий транслирует события участникам: результат входа, старт игры,
// вопросы, показ ответов, финальный рейтинг.
const ALLOWED = new Set([
  "join-result",
  "player-joined",
  "game-started",
  "question",
  "reveal",
  "ended",
  "reset-lobby",
]);

export async function POST(req: NextRequest) {
  try {
    const { gameId, event, data } = await req.json();

    if (!gameId || !event || !ALLOWED.has(event)) {
      return NextResponse.json({ error: "bad-request" }, { status: 400 });
    }

    await getPusherServer().trigger(CHANNEL(gameId), event, data ?? {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
