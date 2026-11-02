# Добавление новых селфи-изображений

Это руководство описывает процесс добавления новых селфи-изображений библейских персонажей в викторину.

## Структура системы

Селфи-викторина использует два основных источника данных:

1. **Изображения**: `/public/images/selfie/` — файлы `.webp`
2. **Данные персонажей**: `src/data/characters.ts` — информация о персонажах
3. **Маппинг изображений**: `src/lib/quiz-generator.ts` — связь персонажей с файлами

## Формат изображений

| Параметр | Требование |
|----------|------------|
| **Формат** | WebP (предпочтительно) или PNG/JPEG |
| **Размер** | 512×512 px или больше (квадрат) |
| **Именование** | `sNN.webp` где NN — порядковый номер (например, `s51.webp`) |
| **Расположение** | `/public/images/selfie/` |

## Шаги добавления нового селфи

### 1. Подготовьте изображение

```bash
# Конвертация PNG в WebP с помощью sharp (через npx)
npx sharp-cli -i input.png -o public/images/selfie/s51.webp --format webp --quality 85
```

Или через скрипт Node.js:
```javascript
const sharp = require('sharp');
await sharp('input.png')
  .resize(512, 512, { fit: 'cover' })
  .webp({ quality: 85 })
  .toFile('public/images/selfie/s51.webp');
```

### 2. Добавьте маппинг в `quiz-generator.ts`

Откройте `src/lib/quiz-generator.ts` и найдите объект `EXISTING_SELFIES`:

```typescript
const EXISTING_SELFIES: Record<string, string> = {
  "Adam": "s01.webp",
  "Eve": "s02.webp",
  // ... существующие персонажи ...
  "Timothy": "s50.webp",
  // Добавьте новый персонаж:
  "Barnabas": "s51.webp",
};
```

**Важно:** Ключ должен точно совпадать с полем `en` в `characters.ts`.

### 3. Проверьте наличие персонажа в `characters.ts`

Убедитесь, что персонаж есть в массиве `CHARACTERS` в файле `src/data/characters.ts`:

```typescript
{
  ru: "Варнава",
  en: "Barnabas",
  level: "easy",          // "easy" | "medium" | "hard"
  visualCue: "Кипр, продал поле", // Подсказка для генерации изображения
  kind: "unique",         // "unique" или "variant" (вариант сцены)
  gender: "male",         // "male" | "female"
  testament: "NT",        // "OT" | "NT"
  era: 81                 // Хронологический порядок (1-100)
}
```

### 4. Добавьте похожих персонажей (опционально)

Для качественных дистракторов (неверных вариантов ответа) добавьте связи в `SIMILAR_CHARACTERS`:

```typescript
export const SIMILAR_CHARACTERS: Record<string, string[]> = {
  // ...
  "barnabas": ["paul", "silas", "timothy"],
  // ...
};
```

### 5. Проверьте сборку

```bash
npm run build
```

## Уровни сложности

| Уровень | Описание | Примеры |
|---------|----------|---------|
| **easy** | Известные персонажи | Моисей, Давид, Мария, Пётр |
| **medium** | Пророки и апостолы | Исаия, Варнава, Тит |
| **hard** | Редкие персонажи | Ахитофел, Епафрас, Нимфа |

## Рекомендуемое распределение

Для сбалансированной игры рекомендуется:
- **Easy**: ~100 персонажей
- **Medium**: ~100 персонажей
- **Hard**: ~100 персонажей

Текущее состояние можно проверить:
```bash
node -e "
const { getQuestionCountsByDifficulty } = require('./src/lib/quiz-generator');
console.log(getQuestionCountsByDifficulty());
"
```

## Персонажи, которые нельзя использовать

Некоторые персонажи не подходят для селфи-викторины:

| Персонаж | Причина |
|----------|---------|
| Седрах, Мисах, Авденаго | Неразличимы на одной сцене (трое юношей в печи) |
| Ангелы | Не являются библейскими людьми |
| Группы людей | Нельзя угадать одного |

## Генерация изображений

При генерации AI-изображений учитывайте:

1. **Промпт должен включать:**
   - Имя персонажа
   - Характерную сцену (`visualCue` из `characters.ts`)
   - Эпоху и регион (Ближний Восток, древность)
   - Формат "селфи" (персонаж смотрит в камеру)

2. **Пример промпта:**
   ```
   Selfie of Barnabas, a middle-aged bearded man from the New Testament era,
   warm Mediterranean appearance, looking at camera with kind eyes,
   background shows Cyprus landscape, ancient Middle Eastern setting,
   realistic biblical portrait style
   ```

3. **Проверяйте результат:**
   - Персонаж должен быть узнаваем по контексту
   - Лицо должно быть хорошо видно
   - Сцена должна соответствовать библейскому повествованию

## Пакетное добавление

Для добавления множества изображений используйте скрипт:

```javascript
// scripts/add-selfies.mjs
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const INPUT_DIR = './new-selfies';
const OUTPUT_DIR = './public/images/selfie';

const files = fs.readdirSync(INPUT_DIR);
let nextNumber = 51; // Начинаем с s51

for (const file of files) {
  if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
  
  const outputName = `s${String(nextNumber).padStart(2, '0')}.webp`;
  await sharp(path.join(INPUT_DIR, file))
    .resize(512, 512, { fit: 'cover' })
    .webp({ quality: 85 })
    .toFile(path.join(OUTPUT_DIR, outputName));
  
  console.log(`${file} → ${outputName}`);
  nextNumber++;
}
```

## Проверка после добавления

1. Запустите локально: `npm run dev`
2. Откройте `/play/host`
3. Выберите уровень сложности с новыми персонажами
4. Проверьте, что изображения загружаются
5. Убедитесь, что дистракторы адекватны

## Связанные файлы

| Файл | Описание |
|------|----------|
| `src/data/characters.ts` | База данных персонажей |
| `src/lib/quiz-generator.ts` | Генератор вопросов и маппинг изображений |
| `public/images/selfie/` | Директория с изображениями |
| `scripts/import-selfies.mjs` | Исходный скрипт импорта (устаревший) |
