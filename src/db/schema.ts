import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  varchar,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

// Enums
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const testamentEnum = pgEnum("testament", ["OT", "NT"]);
export const imageStatusEnum = pgEnum("image_status", ["draft", "approved", "rejected"]);
export const characterKindEnum = pgEnum("character_kind", ["unique", "variant"]);

// Auth.js tables
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  locale: varchar("locale", { length: 10 }).default("ru"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// User settings (JSON for flexibility)
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  settings: jsonb("settings").$type<UserSettingsData>().notNull().default({}),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export interface UserSettingsData {
  autoAdvance?: boolean; // true = auto, false = manual
  questionTime?: number; // seconds (10, 15, 20, 30, 60)
  questionsPerQuiz?: number; // 5, 10, 15, 20
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  theme?: "light" | "dark" | "system";
  soundEnabled?: boolean;
  soundVolume?: number; // 0-100
  showExplanation?: boolean; // show verse/explanation after answer
  showCorrectAnswer?: boolean;
  practiceQuestion?: boolean;
  speedBonus?: boolean; // points for speed
}

// Bible characters with localized names
export const characters = pgTable("characters", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  nameRu: varchar("name_ru", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameI18n: jsonb("name_i18n").$type<Record<string, string>>().default({}),
  gender: genderEnum("gender").notNull(),
  testament: testamentEnum("testament").notNull(),
  era: integer("era").notNull(), // approximate chronological order
  level: difficultyEnum("level").notNull(),
  kind: characterKindEnum("kind").notNull().default("unique"),
  visualCue: text("visual_cue"),
  bibleRefs: text("bible_refs").array(),
  similarIds: integer("similar_ids").array(), // IDs of similar characters for distractors
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Selfie images (multiple per character for different scenes)
export const images = pgTable("images", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  characterId: integer("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  sceneKey: varchar("scene_key", { length: 100 }).notNull(),
  url: text("url").notNull(),
  prompt: text("prompt"),
  model: varchar("model", { length: 50 }),
  levelOverride: difficultyEnum("level_override"),
  status: imageStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Game sessions (for history)
export const games = pgTable("games", {
  id: uuid("id").defaultRandom().primaryKey(),
  hostUserId: uuid("host_user_id").references(() => users.id, { onDelete: "set null" }),
  code: varchar("code", { length: 10 }).notNull(),
  mode: varchar("mode", { length: 20 }).notNull().default("selfie"),
  difficulty: difficultyEnum("difficulty"),
  settings: jsonb("settings").$type<GameSettings>(),
  playerCount: integer("player_count").notNull().default(0),
  questionCount: integer("question_count").notNull().default(10),
  startedAt: timestamp("started_at", { mode: "date" }),
  endedAt: timestamp("ended_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export interface GameSettings {
  questionTime?: number;
  autoAdvance?: boolean;
  practiceQuestion?: boolean;
}

// Questions shown in each game
export const gameRounds = pgTable("game_rounds", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  roundIndex: integer("round_index").notNull(),
  imageId: integer("image_id").references(() => images.id, { onDelete: "set null" }),
  characterId: integer("character_id").references(() => characters.id, { onDelete: "set null" }),
  correctOption: integer("correct_option").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
});

// Player results in games (for history, no personal data beyond name)
export const gameResults = pgTable("game_results", {
visibleId: uuid("visible_id").defaultRandom().primaryKey(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  
  // For signed-in players, link to user for history
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  
  playerName: varchar("player_name", { length: 50 }).notNull(),
  score: integer("score").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalAnswers: integer("total_answers").notNull().default(0),
  rank: integer("rank"),
  
  // Detailed answers for history
  answers: jsonb("answers").$type<PlayerAnswer[]>(),
  
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export interface PlayerAnswer {
  roundIndex: number;
  answer: number | null; // null if no answer
  correct: boolean;
  timeLeft: number;
  points: number;
}

// Donations tracking (filled by webhooks)
export const donations = pgTable("donations", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(), // stripe, paypal, boosty, crypto
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency", { length: 10 }).notNull(),
  externalId: text("external_id"),
  email: text("email"),
  name: text("name"),
  message: text("message"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Types for inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GameResult = typeof gameResults.$inferSelect;
export type NewGameResult = typeof gameResults.$inferInsert;
