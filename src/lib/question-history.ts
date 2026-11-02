// Модуль для отслеживания показанных вопросов с хранением в localStorage
// Вопросы хранятся ~24 часа, после чего могут повторяться

const STORAGE_KEY = "bq-shown-questions";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 часа

interface HistoryEntry {
  character: string; // English name идентификатор
  shownAt: number;   // timestamp
}

interface HistoryData {
  entries: HistoryEntry[];
  lastCleanup: number;
}

// Получить историю из localStorage (только на клиенте)
function getHistory(): HistoryData {
  if (typeof window === "undefined") {
    return { entries: [], lastCleanup: Date.now() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], lastCleanup: Date.now() };
    return JSON.parse(raw) as HistoryData;
  } catch {
    return { entries: [], lastCleanup: Date.now() };
  }
}

// Сохранить историю в localStorage
function saveHistory(data: HistoryData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Игнорируем ошибки записи (квота, приватный режим)
  }
}

// Очистить устаревшие записи (старше 24 часов)
function cleanupExpired(data: HistoryData): HistoryData {
  const now = Date.now();
  const cutoff = now - EXPIRY_MS;
  return {
    entries: data.entries.filter(e => e.shownAt > cutoff),
    lastCleanup: now,
  };
}

// Получить множество показанных персонажей (не старше 24ч)
export function getShownCharacters(): Set<string> {
  const data = cleanupExpired(getHistory());
  saveHistory(data); // Обновляем хранилище после очистки
  return new Set(data.entries.map(e => e.character));
}

// Добавить показанных персонажей в историю
export function addShownCharacters(characters: string[]): void {
  const data = cleanupExpired(getHistory());
  const now = Date.now();
  
  for (const character of characters) {
    // Проверяем, не добавлен ли уже
    if (!data.entries.some(e => e.character === character)) {
      data.entries.push({ character, shownAt: now });
    }
  }
  
  saveHistory(data);
}

// Очистить всю историю (для отладки)
export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// Получить статистику истории
export function getHistoryStats(): { total: number; oldestMs: number | null } {
  const data = getHistory();
  if (data.entries.length === 0) {
    return { total: 0, oldestMs: null };
  }
  const oldest = Math.min(...data.entries.map(e => e.shownAt));
  return {
    total: data.entries.length,
    oldestMs: Date.now() - oldest,
  };
}
