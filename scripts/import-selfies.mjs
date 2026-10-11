// Импорт селфи героев из src/selfie (файлы вида "01_Адам.png").
// Имя файла = имя героя = правильный ответ.
// 1) Сжимает картинки в public/images/selfie/sNN.webp
// 2) Пересобирает 5 селфи-викторин в src/data/quizzes.json: по 10 героев
//    в порядке номеров, 3 неверных варианта — герои того же пола из той же эпохи.
//
// Запуск: node scripts/import-selfies.mjs
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcDir = join(root, "src/selfie");
const outDir = join(root, "public/images/selfie");
const dataFile = join(root, "src/data/quizzes.json");

const PARTS = 5;
const PER_PART = 10;

// Подзаголовки частей (по эпохам)
const DESCRIPTIONS = [
  "Угадай героя по селфи: от Эдема до Исхода",
  "Угадай героя по селфи: от пустыни до Самуила",
  "Угадай героя по селфи: цари и пророки",
  "Угадай героя по селфи: пророки, плен и Рождество",
  "Угадай героя по селфи: Иисус и апостолы",
];

// Пробный вопрос части k — узнаваемый герой из предыдущей части (по кругу),
// чтобы при игре по порядку пробный вопрос не раскрывал ответы текущей части.
const PRACTICE_NUMS = [42, 9, 15, 22, 27];

// Пол героя нужен, чтобы неверные варианты не были очевидными
const FEMALE = new Set([
  "Ева", "Сарра", "Мариам", "Раав", "Далида", "Руфь", "Анна", "Есфирь",
  "Елисавета", "Мария", "Мария Магдалина",
]);

// Отображаемые имена для составных названий файлов
const DISPLAY = {
  "Иосиф муж Марии": "Иосиф, муж Марии",
  "Иоанн апостол": "Апостол Иоанн",
};

// «Похожие» герои — чтобы запутать: общий сюжет, обстановка, родство, служение.
// В каждый вопрос попадают 2 из списка; третий неверный вариант — герой той же эпохи.
// Ключ — имя из названия файла (с пробелами вместо «_»).
const SIMILAR = {
  "Адам": ["Ной", "Авель", "Каин"], // сад и звери, сыновья Адама
  "Ева": ["Сарра", "Ревекка", "Рахиль"], // праматери
  "Ной": ["Иона", "Моисей", "Мафусаил"], // вода и корабль, корзина на воде, долгожитель
  "Авраам": ["Исаак", "Лот", "Мелхиседек"],
  "Сарра": ["Елисавета", "Ревекка", "Анна"], // чудесное рождение в старости
  "Исаак": ["Авраам", "Исав", "Иаков"],
  "Иаков": ["Исав", "Исаак", "Лаван"],
  "Иосиф": ["Даниил", "Вениамин", "Рувим"], // толкователь снов при чужом дворе
  "Моисей": ["Аарон", "Иисус Навин", "Илия"], // встреча с Богом на горе
  "Аарон": ["Моисей", "Мелхиседек", "Елеазар"], // священники
  "Мариам": ["Девора", "Иохаведа", "Анна"], // пророчица с песней
  "Иисус Навин": ["Халев", "Гедеон", "Моисей"],
  "Раав": ["Фамарь", "Руфь", "Далида"],
  "Гедеон": ["Варак", "Иеффай", "Самсон"], // судьи-воины
  "Самсон": ["Давид", "Голиаф", "Гедеон"], // львы и сила
  "Далида": ["Иезавель", "Вирсавия", "Раав"],
  "Руфь": ["Ноеминь", "Орфа", "Есфирь"],
  "Вооз": ["Иессей", "Овид", "Иосиф"], // жатва и зерно
  "Анна": ["Сарра", "Елисавета", "Феннана"], // молитва о сыне
  "Самуил": ["Илий", "Нафан", "Елисей"],
  "Саул": ["Давид", "Ионафан", "Авессалом"],
  "Давид": ["Самсон", "Голиаф", "Соломон"], // лев, праща, сын
  "Ионафан": ["Давид", "Саул", "Авенир"],
  "Соломон": ["Давид", "Ровоам", "Езекия"],
  "Илия": ["Елисей", "Иоанн Креститель", "Енох"], // огонь, пустыня, взят на небо
  "Елисей": ["Илия", "Гиезий", "Нееман"],
  "Иона": ["Ной", "Павел", "Наум"], // море, кораблекрушение, Ниневия
  "Иов": ["Елиуй", "Авраам", "Иеремия"],
  "Исайя": ["Иеремия", "Иезекииль", "Михей"],
  "Иеремия": ["Варух", "Исайя", "Иезекииль"],
  "Иезекииль": ["Даниил", "Иеремия", "Исайя"],
  "Даниил": ["Седрах", "Давид", "Самсон"], // друг Даниила, львы
  "Седрах": ["Мисах", "Авденаго", "Даниил"],
  "Есфирь": ["Астинь", "Руфь", "Далида"],
  "Неемия": ["Ездра", "Зоровавель", "Мардохей"],
  "Захария": ["Симеон", "Аарон", "Илий"], // священники в храме
  "Елисавета": ["Мария", "Анна", "Сарра"],
  "Мария": ["Елисавета", "Марфа", "Мария Магдалина"],
  "Иосиф муж Марии": ["Захария", "Иосиф Аримафейский", "Симеон"],
  "Иоанн Креститель": ["Илия", "Апостол Иоанн", "Андрей"],
  "Иисус Христос": ["Иоанн Креститель", "Пётр", "Апостол Иоанн"],
  "Пётр": ["Андрей", "Апостол Иоанн", "Иаков Зеведеев"], // рыбаки
  "Андрей": ["Пётр", "Филипп", "Иаков Зеведеев"],
  "Иоанн апостол": ["Иаков Зеведеев", "Иоанн Креститель", "Пётр"],
  "Матфей": ["Закхей", "Марк", "Лука"], // мытарь, евангелисты
  "Фома": ["Нафанаил", "Филипп", "Фаддей"],
  "Мария Магдалина": ["Марфа", "Саломия", "Мария"],
  "Павел": ["Варнава", "Сила", "Стефан"],
  "Сила": ["Варнава", "Тимофей", "Лука"],
  "Тимофей": ["Тит", "Сила", "Лука"],
};

// детерминированный ГСЧ — повторный запуск даёт тот же результат
let seed = 20261011;
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const files = (await readdir(srcDir)).filter((f) => /^\d+_.+\.(png|jpe?g|webp)$/i.test(f)).sort();
if (files.length !== PARTS * PER_PART) {
  throw new Error(`Ожидалось ${PARTS * PER_PART} файлов в src/selfie, найдено ${files.length}`);
}

await mkdir(outDir, { recursive: true });
const heroes = [];
for (const f of files) {
  const num = parseInt(f, 10);
  const raw = f.replace(/^\d+_/, "").replace(/\.[^.]+$/, "").replace(/_/g, " ");
  const name = DISPLAY[raw] ?? raw;
  const image = `/images/selfie/s${String(num).padStart(2, "0")}.webp`;
  await sharp(join(srcDir, f)).resize(840, 840, { fit: "cover" }).webp({ quality: 80 }).toFile(join(root, "public", image));
  heroes.push({ num, raw, name, image, female: FEMALE.has(raw) });
}

// «Иосиф» и «Иосиф, муж Марии» и т.п. не ставим рядом — слишком путано
const firstWord = (h) => h.raw.split(" ")[0];

function distractors(hero) {
  const similar = SIMILAR[hero.raw];
  if (!similar) throw new Error(`Нет похожих героев для «${hero.raw}» в SIMILAR`);
  // 2 «похожих» варианта
  const picked = shuffle(similar).slice(0, 2);
  // третий — герой той же эпохи и пола
  const pool = heroes
    .filter((h) => h !== hero && h.female === hero.female && firstWord(h) !== firstWord(hero))
    .filter((h) => !picked.includes(h.name) && h.raw !== "Иисус Христос")
    .sort((a, b) => Math.abs(a.num - hero.num) - Math.abs(b.num - hero.num))
    .slice(0, 8);
  picked.push(shuffle(pool)[0].name);
  return picked;
}

function question(hero, correct) {
  const wrong = distractors(hero);
  const options = [...wrong];
  options.splice(correct, 0, hero.name);
  return { character: hero.name, options, correct, image: hero.image };
}

const line = (o) =>
  "{ " +
  Object.entries(o)
    .map(([k, v]) => `${JSON.stringify(k)}: ${Array.isArray(v) ? "[" + v.map((x) => JSON.stringify(x)).join(", ") + "]" : JSON.stringify(v)}`)
    .join(", ") +
  " }";

// Правим JSON построчно, чтобы сохранить компактный формат файла
let text = (await readFile(dataFile, "utf8")).replace(/\r\n/g, "\n");
for (let p = 0; p < PARTS; p++) {
  const id = `selfie-${p + 1}`;
  const part = heroes.slice(p * PER_PART, (p + 1) * PER_PART);
  // правильный ответ равномерно по позициям A–D
  const positions = shuffle([0, 1, 2, 3, 0, 1, 2, 3, ...shuffle([0, 1, 2, 3]).slice(0, 2)]);
  const qs = part.map((h, i) => "        " + line(question(h, positions[i])));
  const practiceHero = heroes.find((h) => h.num === PRACTICE_NUMS[p]);
  const practice = question(practiceHero, Math.floor(rnd() * 4));

  const re = new RegExp(
    `(      "id": "${id}",\\n[\\s\\S]*?      "description": )[^\\n]*\\n([\\s\\S]*?)      "practice": [^\\n]*\\n      "questions": \\[\\n[\\s\\S]*?\\n      \\]`
  );
  if (!re.test(text)) throw new Error(`Не найден блок викторины ${id}`);
  text = text.replace(
    re,
    (_, head, mid) =>
      `${head}${JSON.stringify(DESCRIPTIONS[p])},\n${mid}      "practice": ${line(practice)},\n      "questions": [\n${qs.join(",\n")}\n      ]`
  );
}
JSON.parse(text);
await writeFile(dataFile, text, "utf8");

console.log(`Импортировано ${heroes.length} селфи → public/images/selfie/*.webp, викторины selfie-1…${PARTS} обновлены`);
