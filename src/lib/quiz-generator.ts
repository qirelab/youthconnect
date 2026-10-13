// Random quiz generator using character data
// Generates questions dynamically instead of using fixed quizzes

import { 
  CHARACTERS, 
  SIMILAR_CHARACTERS, 
  FEMALE_CHARACTERS,
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

// Generate slug from name
function slug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

// Get similar characters for distractors
function getSimilarCharacters(char: CharacterEntry): string[] {
  const charSlug = slug(char.en);
  const similar = SIMILAR_CHARACTERS[charSlug];
  
  if (similar && similar.length > 0) {
    return similar;
  }
  
  // Fallback: find characters of same gender and testament
  const isFemale = FEMALE_CHARACTERS.has(slug(char.en));
  const sameCriteria = CHARACTERS.filter(c => {
    if (c.en === char.en) return false;
    const cIsFemale = FEMALE_CHARACTERS.has(slug(c.en));
    return cIsFemale === isFemale && c.testament === char.testament;
  });
  
  return sameCriteria.slice(0, 3).map(c => c.en);
}

// Generate distractor options (wrong answers)
function generateDistractors(char: CharacterEntry, exclude: Set<string>): string[] {
  const similar = getSimilarCharacters(char);
  const distractors: string[] = [];
  
  // Add similar characters first
  for (const name of similar) {
    if (!exclude.has(name) && distractors.length < 3) {
      distractors.push(name);
      exclude.add(name);
    }
  }
  
  // Fill remaining with characters of same gender
  if (distractors.length < 3) {
    const isFemale = FEMALE_CHARACTERS.has(slug(char.en));
    const pool = CHARACTERS.filter(c => {
      if (c.en === char.en) return false;
      if (exclude.has(c.en)) return false;
      const cIsFemale = FEMALE_CHARACTERS.has(slug(c.en));
      return cIsFemale === isFemale;
    });
    
    // Shuffle and take what we need
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (const c of shuffled) {
      if (distractors.length >= 3) break;
      distractors.push(c.en);
      exclude.add(c.en);
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

// Generate a random quiz with specified difficulty and count
export function generateRandomQuiz(
  difficulty?: DifficultyLevel,
  questionCount: number = 10
): { questions: GeneratedQuestion[]; practice: GeneratedQuestion | null } {
  let availableChars = getCharactersWithImages(difficulty);
  
  // If mixed difficulty, get proportional distribution
  if (!difficulty) {
    const easy = getCharactersWithImages("easy");
    const medium = getCharactersWithImages("medium");
    const hard = getCharactersWithImages("hard");
    
    // Mix: ~40% easy, ~40% medium, ~20% hard
    const easyCount = Math.ceil(questionCount * 0.4);
    const mediumCount = Math.ceil(questionCount * 0.4);
    const hardCount = questionCount - easyCount - mediumCount;
    
    availableChars = [
      ...shuffle(easy).slice(0, easyCount),
      ...shuffle(medium).slice(0, mediumCount),
      ...shuffle(hard).slice(0, hardCount),
    ];
  }
  
  // Shuffle and limit to question count
  const selectedChars = shuffle(availableChars).slice(0, questionCount);
  const usedNames = new Set<string>(selectedChars.map(c => c.en));
  
  const questions: GeneratedQuestion[] = selectedChars.map(char => {
    const distractors = generateDistractors(char, new Set(usedNames));
    const correctPosition = Math.floor(Math.random() * 4);
    
    const options = [...distractors];
    options.splice(correctPosition, 0, char.ru);
    
    // Convert distractors to Russian names
    const finalOptions = options.map((opt, i) => {
      if (i === correctPosition) return char.ru;
      const found = CHARACTERS.find(c => c.en === opt);
      return found?.ru || opt;
    });
    
    return {
      character: char.en,
      characterRu: char.ru,
      options: finalOptions,
      correct: correctPosition,
      image: `/images/selfie/${EXISTING_SELFIES[char.en]}`,
      visualCue: char.visualCue,
    };
  });
  
  // Generate practice question from a different character
  const practiceChars = getCharactersWithImages("easy").filter(c => !usedNames.has(c.en));
  let practice: GeneratedQuestion | null = null;
  
  if (practiceChars.length > 0) {
    const practiceChar = practiceChars[Math.floor(Math.random() * practiceChars.length)];
    const distractors = generateDistractors(practiceChar, new Set(usedNames));
    const correctPosition = Math.floor(Math.random() * 4);
    
    const options = [...distractors];
    options.splice(correctPosition, 0, practiceChar.ru);
    
    const finalOptions = options.map((opt, i) => {
      if (i === correctPosition) return practiceChar.ru;
      const found = CHARACTERS.find(c => c.en === opt);
      return found?.ru || opt;
    });
    
    practice = {
      character: practiceChar.en,
      characterRu: practiceChar.ru,
      options: finalOptions,
      correct: correctPosition,
      image: `/images/selfie/${EXISTING_SELFIES[practiceChar.en]}`,
      visualCue: practiceChar.visualCue,
    };
  }
  
  return { questions, practice };
}

// Export for use in settings
export const AVAILABLE_QUESTION_COUNTS = [5, 10, 15, 20];
export const AVAILABLE_QUESTION_TIMES = [10, 15, 20, 30, 60];
