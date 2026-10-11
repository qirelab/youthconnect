import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { CHANNEL, EVENTS } from "@/lib/types";

// Игрок отправляет ответ на текущий вопрос. Ведущий собирает ответы и считает очки.
export async function POST(req: NextRequest) {
  try {
    const { gameId, playerId, name, index, answer, timeLeft } = await req.json();

    if (
      !gameId ||
      !playerId ||
      typeof index !== "number" ||
      typeof answer !== "number"
    ) {
      return NextResponse.json({ error: "bad-request" }, { status: 400 });
    }

    await getPusherServer().trigger(CHANNEL(gameId), EVENTS.answer, {
      playerId,
      name,
      index,
      answer,
      timeLeft: typeof timeLeft === "number" ? timeLeft : 0,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
