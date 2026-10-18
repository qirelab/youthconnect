// Random quiz generator using character data
// Generates questions dynamically instead of using fixed quizzes

import { 
  CHARACTERS, 
  SIMILAR_CHARACTERS, 
  FEMALE_CHARACTERS,
  generateSlug,
  type CharacterEntry,
  type DifficultyLevel 
} from "@/data/characters";

export const QUESTION_DURATION = 15; // seconds
export const REVEAL_DURATION = 5; // seconds
export const PRACTICE_INDEX = -1;

// Map existing selfie images to characters (the 50 we have)
// These are indexed by the original import order
const EXISTING_SELFIES: Record<string, string> = {
  "Adam": "s01.webp",
  "Eve": "s02.webp",
  "Noah": "s03.webp",
  "Abraham": "s04.webp",
  "Sarah": "s05.webp",
  "Isaac": "s06.webp",
  "Jacob": "s07.webp",
  "Joseph": "s08.webp",
  "Moses": "s09.webp",
  "Aaron": "s10.webp",
  "Miriam": "s11.webp",
  "Joshua": "s12.webp",
  "Rahab": "s13.webp",
  "Gideon": "s14.webp",
  "Samson": "s15.webp",
  "Delilah": "s16.webp",
  "Ruth": "s17.webp",
  "Boaz": "s18.webp",
  "Hannah": "s19.webp",
  "Samuel": "s20.webp",
  "Saul": "s21.webp",
  "David": "s22.webp",
  "Jonathan": "s23.webp",
  "Solomon": "s24.webp",
  "Elijah": "s25.webp",
  "Elisha": "s26.webp",
  "Jonah": "s27.webp",
  "Job": "s28.webp",
  "Isaiah": "s29.webp",
  "Jeremiah": "s30.webp",
  "Ezekiel": "s31.webp",
  "Daniel": "s32.webp",
  "Shadrach": "s33.webp",
  "Esther": "s34.webp",
  "Nehemiah": "s35.webp",
  "Zechariah": "s36.webp",
  "Elizabeth": "s37.webp",
  "Mary": "s38.webp",
  "Joseph, husband of Mary": "s39.webp",
  "John the Baptist": "s40.webp",
  "Jesus Christ": "s41.webp",
  "Peter": "s42.webp",
  "Andrew": "s43.webp",
  "John apostle": "s44.webp",
  "Matthew": "s45.webp",
  "Thomas": "s46.webp",
  "Mary Magdalene": "s47.webp",
  "Paul": "s48.webp",
  "Silas": "s49.webp",
  "Timothy": "s50.webp",
};

// Build lookup maps for character resolution
const CHARACTER_BY_EN = new Map<string, CharacterEntry>();
const CHARACTER_BY_SLUG = new Map<string, CharacterEntry>();
for (const c of CHARACTERS) {
  if (c.kind === "unique") {
    if (!CHARACTER_BY_EN.has(c.en)) {
      CHARACTER_BY_EN.set(c.en, c);
    }
    const slug = generateSlug(c.en);
    if (!CHARACTER_BY_SLUG.has(slug)) {
      CHARACTER_BY_SLUG.set(slug, c);
    }
  }
}

// Resolve a name (English or slug) to a CharacterEntry
function resolveCharacter(nameOrSlug: string): CharacterEntry | undefined {
  return CHARACTER_BY_EN.get(nameOrSlug) || CHARACTER_BY_SLUG.get(nameOrSlug);
}

// Get characters that have existing images
function getCharactersWithImages(level?: DifficultyLevel): CharacterEntry[] {
  const chars = CHARACTERS.filter(c => {
    // Check if we have an image for this character
    const hasImage = EXISTING_SELFIES[c.en] !== undefined;
    if (!hasImage) return false;
    
    // Filter by level if specified
    if (level && c.level !== level) return false;
    
    // Only include unique characters (not variants) for now
    if (c.kind !== "unique") return false;
    
    return true;
  });
  
  return chars;
}

// Get available question count for a difficulty (exported for UI)
export function getAvailableQuestionCount(difficulty?: DifficultyLevel | "mixed"): number {
  if (!difficulty || difficulty === "mixed") {
    return Object.keys(EXISTING_SELFIES).length;
  }
  return getCharactersWithImages(difficulty).length;
}

// Get counts per difficulty level (exported for UI)
export function getQuestionCountsByDifficulty(): Record<DifficultyLevel | "mixed", number> {
  return {
    easy: getCharactersWithImages("easy").length,
    medium: getCharactersWithImages("medium").length,
    hard: getCharactersWithImages("hard").length,
    mixed: Object.keys(EXISTING_SELFIES).length,
  };
}

// Get similar characters for distractors (returns CharacterEntry objects, not names)
function getSimilarCharacters(char: CharacterEntry): CharacterEntry[] {
  const charSlug = generateSlug(char.en);
  const similarSlugs = SIMILAR_CHARACTERS[charSlug];
  const result: CharacterEntry[] = [];
  
  if (similarSlugs && similarSlugs.length > 0) {
    for (const slug of similarSlugs) {
      const resolved = resolveCharacter(slug);
      if (resolved && resolved.en !== char.en) {
        result.push(resolved);
      }
    }
  }
  
  return result;
}

// Generate distractor options (wrong answers) - returns CharacterEntry objects
function generateDistractors(char: CharacterEntry, excludeEn: Set<string>): CharacterEntry[] {
  const distractors: CharacterEntry[] = [];
  const usedEn = new Set<string>(excludeEn);
  usedEn.add(char.en);
  
  // First try similar characters
  const similar = getSimilarCharacters(char);
  for (const c of similar) {
    if (!usedEn.has(c.en) && distractors.length < 3) {
      distractors.push(c);
      usedEn.add(c.en);
    }
  }
  
  // Fill remaining with characters of same gender and testament
  if (distractors.length < 3) {
    const isFemale = char.gender === "female";
    const pool = CHARACTERS.filter(c => {
      if (c.kind !== "unique") return false;
      if (usedEn.has(c.en)) return false;
      return c.gender === (isFemale ? "female" : "male") && c.testament === char.testament;
    });
    
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (const c of shuffled) {
      if (distractors.length >= 3) break;
      distractors.push(c);
      usedEn.add(c.en);
    }
  }
  
  // Last resort: any character of same gender
  if (distractors.length < 3) {
    const isFemale = char.gender === "female";
    const pool = CHARACTERS.filter(c => {
      if (c.kind !== "unique") return false;
      if (usedEn.has(c.en)) return false;
      return c.gender === (isFemale ? "female" : "male");
    });
    
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (const c of shuffled) {
      if (distractors.length >= 3) break;
      distractors.push(c);
      usedEn.add(c.en);
    }
  }
  
  return distractors.slice(0, 3);
}

export interface GeneratedQuestion {
  character: string;
  characterRu: string;
  options: string[];
  correct: number;
  image: string;
  visualCue?: string;
}

// Shuffle array in place
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Helper to create a question from a character
function createQuestion(
  char: CharacterEntry, 
  usedNames: Set<string>
): GeneratedQuestion {
  const distractorChars = generateDistractors(char, usedNames);
  const correctPosition = Math.floor(Math.random() * 4);
  
  // Build options array with Russian names
  const options: string[] = distractorChars.map(c => c.ru);
  options.splice(correctPosition, 0, char.ru);
  
  return {
    character: char.en,
    characterRu: char.ru,
    options,
    correct: correctPosition,
    image: `/images/selfie/${EXISTING_SELFIES[char.en]}`,
    visualCue: char.visualCue,
  };
}

// Generate a random quiz with specified difficulty and count
export function generateRandomQuiz(
  difficulty?: DifficultyLevel,
  questionCount: number = 10
): { questions: GeneratedQuestion[]; practice: GeneratedQuestion | null } {
  const allWithImages = CHARACTERS.filter(
    c => c.kind === "unique" && EXISTING_SELFIES[c.en] !== undefined
  );
  
  let selectedChars: CharacterEntry[] = [];
  
  if (!difficulty) {
    // Mixed: ~40% easy, ~40% medium, ~20% hard, with backfill
    const easy = shuffle(allWithImages.filter(c => c.level === "easy"));
    const medium = shuffle(allWithImages.filter(c => c.level === "medium"));
    const hard = shuffle(allWithImages.filter(c => c.level === "hard"));
    
    const targetEasy = Math.ceil(questionCount * 0.4);
    const targetMedium = Math.ceil(questionCount * 0.4);
    const targetHard = questionCount - targetEasy - targetMedium;
    
    // Take what we can from each level
    const fromEasy = easy.slice(0, targetEasy);
    const fromMedium = medium.slice(0, targetMedium);
    const fromHard = hard.slice(0, targetHard);
    
    selectedChars = [...fromEasy, ...fromMedium, ...fromHard];
    
    // Backfill if we don't have enough
    if (selectedChars.length < questionCount) {
      const used = new Set(selectedChars.map(c => c.en));
      const remaining = shuffle(allWithImages.filter(c => !used.has(c.en)));
      const needed = questionCount - selectedChars.length;
      selectedChars.push(...remaining.slice(0, needed));
    }
  } else {
    // Single difficulty with backfill from other levels
    const primary = shuffle(allWithImages.filter(c => c.level === difficulty));
    selectedChars = primary.slice(0, questionCount);
    
    // Backfill from other levels if needed
    if (selectedChars.length < questionCount) {
      const used = new Set(selectedChars.map(c => c.en));
      const others = shuffle(allWithImages.filter(c => c.level !== difficulty && !used.has(c.en)));
      const needed = questionCount - selectedChars.length;
      selectedChars.push(...others.slice(0, needed));
    }
  }
  
  // Final shuffle and cap
  selectedChars = shuffle(selectedChars).slice(0, questionCount);
  const usedNames = new Set<string>(selectedChars.map(c => c.en));
  
  const questions: GeneratedQuestion[] = selectedChars.map(char => 
    createQuestion(char, usedNames)
  );
  
  // Generate practice question from an easy character not in the quiz
  const practicePool = allWithImages.filter(c => c.level === "easy" && !usedNames.has(c.en));
  let practice: GeneratedQuestion | null = null;
  
  if (practicePool.length > 0) {
    const practiceChar = practicePool[Math.floor(Math.random() * practicePool.length)];
    practice = createQuestion(practiceChar, usedNames);
  } else if (allWithImages.length > 0) {
    // Fallback: use any character not in quiz
    const fallbackPool = allWithImages.filter(c => !usedNames.has(c.en));
    if (fallbackPool.length > 0) {
      const practiceChar = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
      practice = createQuestion(practiceChar, usedNames);
    }
  }
  
  return { questions, practice };
}

// Export for use in settings
export const AVAILABLE_QUESTION_COUNTS = [5, 10, 15, 20];
export const AVAILABLE_QUESTION_TIMES = [10, 15, 20, 30, 60];
