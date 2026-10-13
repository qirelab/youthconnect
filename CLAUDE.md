# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект

Библейская викторина в стиле Kahoot для живых мероприятий (Next.js 15 App Router + TypeScript, React 19, деплой на Vercel). Ведущий открывает `/host` на большом экране и показывает QR-код; участники заходят с телефонов по `/?game=КОД`. Интерфейс, комментарии и коммиты — на русском.

## Команды

```bash
npm run dev                     # локально; для телефонов в той же Wi-Fi: npm run dev -- -H 0.0.0.0
npm run build                   # прод-сборка (заодно проверка типов)
npx tsc --noEmit                # только проверка типов
node scripts/import-selfies.mjs # пересобрать селфи-викторины из src/selfie/
node scripts/test-pusher.mjs    # проверить ключи Pusher из .env.local
```

Тестов и конфигурации ESLint нет.

Нужны 4 переменные окружения (см. `.env.example`): `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`. Все чтения идут через `cleanEnv()` из `src/lib/env.ts` — он убирает BOM, кавычки и пробелы, которые попадают при вставке значений из PowerShell или дашборда.

## Архитектура

**Базы данных и серверного состояния нет.** Источник правды — браузер ведущего (`src/app/host/page.tsx`): там хранятся игроки, ответы, очки, порядок вопросов и таймеры, в основном в `useRef`, чтобы обработчики Pusher видели актуальные значения. Перезагрузка экрана ведущего сбрасывает игру.

**Real-time идёт через Pusher Channels**, один публичный канал на игру: `quiz-{gameId}` (`CHANNEL()` в `src/lib/types.ts`). Браузеры подписываются на канал напрямую через `pusher-js`, поэтому Vercel не нужно держать WebSocket. Клиенты не могут публиковать события сами — каждое событие отправляется через тонкий API-роут, который вызывает `pusher.trigger()` с серверным секретом:

- `POST /api/join` — игрок → `join-request`
- `POST /api/answer` — игрок → `answer`
- `POST /api/host` — ведущий → любое событие из белого списка `ALLOWED` (`join-result`, `player-joined`, `game-started`, `question`, `reveal`, `ended`, `reset-lobby`)

Клиентские обёртки лежат в `src/lib/api.ts`. Все имена событий и типы полезной нагрузки описаны в `src/lib/types.ts`. Новое событие от ведущего нужно добавить и в `EVENTS`, и в `ALLOWED` в `src/app/api/host/route.ts`.

**Вход игрока.** Телефон генерирует `tempId` и отправляет имя. Ведущий проверяет, что имя уникально, и отвечает `join-result` (`name-taken` / `closed`). Id игрока и имя сохраняются в `localStorage` (`bq-name-{gameId}`), поэтому перезагрузка телефона не выкидывает из игры.

**Ход игры** (асинхронный цикл в `host/page.tsx`): сначала пробный вопрос (`practice`, индекс `PRACTICE_INDEX = -1`, без очков), затем вопросы в перемешанном порядке. На каждом шаге: `question` → `QUESTION_DURATION` (15 с) → `reveal` с текущим рейтингом → `REVEAL_DURATION` (5 с) → автоматический переход. В конце — `ended`. Очки зависят от оставшегося времени (`points()`). Игрокам уходит только `PublicQuestion`, без правильного ответа; `correct` раскрывается в `reveal`. `runRef` защищает от параллельных циклов при перезапуске.

**Контент:** `src/data/quizzes.json` — 10 викторин по 10 вопросов, типы `text` и `selfie`. Загружается через `src/lib/quizzes.ts`. У селфи-вопросов нет поля `q` (текст подставляет `questionPrompt()`), картинка выводится только на экран ведущего, а варианты ответа — только на телефоны.

**Селфи-викторины генерируются, вручную их не правят.** `scripts/import-selfies.mjs` берёт `src/selfie/NN_Имя.png` (имя файла = правильный ответ), сжимает в `public/images/selfie/sNN.webp` через `sharp` (приходит транзитивно от Next, в `package.json` его нет) и перезаписывает селфи-викторины в `quizzes.json`. Неверные варианты берутся из таблиц `SIMILAR`/`FEMALE`/эпох в самом скрипте. Текстовые викторины скрипт не трогает.

## Деплой

Production — пуш в ветку `master` (Vercel подключён к GitHub `qirelab/youthconnect`). `.vercelignore` исключает `src/selfie/` (исходники ~132 МБ лежат в git, но в деплой не попадают) и `img/`.
