// Генерирует SVG-плейсхолдеры «селфи» из сцен, описанных в quizzes.json.
// Эмодзи-фон даёт подсказку по обстановке — игра работает сразу.
// Замените эти файлы на реальные AI-селфи с теми же именами (s01.svg … s50.svg → можно .jpg/.png).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const data = JSON.parse(await readFile(join(root, "src/data/quizzes.json"), "utf8"));
const outDir = join(root, "public/images/selfie");
await mkdir(outDir, { recursive: true });

const PALETTES = [
  ["#3b1d6b", "#7b4bd6"],
  ["#0b3d61", "#2b8fd6"],
  ["#5a3200", "#d89e00"],
  ["#0d4a1f", "#2fb65a"],
  ["#5a0f2b", "#d6366b"],
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let count = 0;
for (const quiz of data.quizzes) {
  if (quiz.type !== "selfie") continue;
  for (const q of quiz.questions) {
    if (!q.image) continue;
    const file = q.image.split("/").pop();
    const n = parseInt(file.replace(/\D/g, ""), 10) || 0;
    const [c1, c2] = PALETTES[n % PALETTES.length];
    const scene = q.scene || [];

    // раскладываем эмодзи сцены по «фону» фотографии
    const positions = [
      [130, 150], [370, 160], [100, 340], [400, 360], [250, 110], [250, 430],
    ];
    const sceneEls = scene
      .slice(0, 6)
      .map((e, i) => {
        const [x, y] = positions[i] || [250, 250];
        return `<text x="${x}" y="${y}" font-size="86" text-anchor="middle" opacity="0.9">${esc(e)}</text>`;
      })
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="500" height="500" fill="url(#g)"/>
  ${sceneEls}
  <circle cx="250" cy="250" r="96" fill="rgba(0,0,0,0.25)"/>
  <text x="250" y="290" font-size="130" text-anchor="middle">🤳</text>
  <text x="250" y="475" font-size="26" text-anchor="middle" fill="#ffffff" opacity="0.85" font-family="sans-serif" font-weight="bold">СЕЛФИ #${String(n).padStart(2, "0")}</text>
</svg>`;

    await writeFile(join(outDir, file), svg, "utf8");
    count++;
  }
}

console.log(`Сгенерировано ${count} SVG-плейсхолдеров в public/images/selfie/`);
