// Очистка значений переменных окружения: убирает невидимый BOM (U+FEFF),
// кавычки и пробелы, которые легко попадают при вставке через PowerShell/дашборд.
export function cleanEnv(value: string | undefined): string | undefined {
  const v = value?.replace(/﻿/g, "").trim().replace(/^["']|["']$/g, "");
  return v || undefined;
}
