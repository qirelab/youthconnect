import { NextRequest, NextResponse } from "next/server";
import { getPusherServer } from "@/lib/pusher-server";
import { CHANNEL, EVENTS } from "@/lib/types";

// Игрок присылает запрос на вход. Проверку уникальности имени делает ведущий
// (источник правды), затем отвечает событием join-result.
export async function POST(req: NextRequest) {
  try {
    const { gameId, tempId, name } = await req.json();

    if (!gameId || !tempId || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "bad-request" }, { status: 400 });
    }

    await getPusherServer().trigger(CHANNEL(gameId), EVENTS.joinRequest, {
      tempId,
      name: name.trim().slice(0, 24),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
