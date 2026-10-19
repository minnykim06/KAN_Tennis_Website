import { z } from "zod";
import { isErrorKey, type ErrorKey } from "@/lib/i18n";

// Every zod message is an i18n ErrorKey, so actions can return it directly.
const msg = (key: ErrorKey) => ({ message: key });

/** Trim, collapse inner whitespace and NFC-normalize (important for Korean). */
export function normalizeName(raw: string): string {
  return raw.normalize("NFC").trim().replace(/\s+/g, " ");
}

export const nameSchema = z
  .string(msg("invalidName"))
  .transform(normalizeName)
  .pipe(
    z
      .string()
      .min(1, msg("nameRequired"))
      .max(40, msg("nameTooLong"))
      // Letters from any script (Hangul, Latin, ...), spaces, . ' -
      .regex(/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u, msg("invalidName")),
  );

// Not trimmed: spaces are allowed and count. bcrypt only uses the first 72 bytes, hence the cap.
export const passwordSchema = z
  .string(msg("invalidPassword"))
  .min(4, msg("invalidPassword"))
  .max(64, msg("passwordTooLong"));

export const signInSchema = z.object({ name: nameSchema, password: passwordSchema });

export const registerSchema = z
  .object({ name: nameSchema, password: passwordSchema, passwordConfirm: z.string() })
  .refine((v) => v.password === v.passwordConfirm, msg("passwordMismatch"));

export const changePasswordSchema = z
  .object({ currentPassword: z.string(msg("wrongCurrentPassword")).min(1, msg("wrongCurrentPassword")), newPassword: passwordSchema, newPasswordConfirm: z.string() })
  .refine((v) => v.newPassword === v.newPasswordConfirm, msg("passwordMismatch"))
  .refine((v) => v.newPassword !== v.currentPassword, msg("samePassword"));

// z.guid(): any 8-4-4-4-12 hex id (z.uuid() would reject the readable seed ids).
const id = z.guid(msg("invalidInput"));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, msg("invalidDate"));
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, msg("invalidTime"))
  .transform((t) => t.slice(0, 5));
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, msg("textTooLong"))
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .optional()
    .transform((s) => s ?? null);

export const gameDaySchema = z
  .object({
    date,
    start_time: time,
    end_time: time,
    location: z.string().trim().min(1, msg("locationRequired")).max(100, msg("textTooLong")),
    notes: optionalText(500),
    format: z.enum(["singles", "doubles"], msg("invalidInput")),
  })
  .refine((v) => v.end_time > v.start_time, msg("endBeforeStart"));

// Partners: "" or missing → null (singles).
const optionalId = z
  .union([z.literal(""), id])
  .nullable()
  .optional()
  .transform((v) => v || null);

const matchPlayers = {
  player1_id: id,
  player2_id: id,
  partner1_id: optionalId,
  partner2_id: optionalId,
  court: optionalText(20),
};

type MatchPlayers = { player1_id: string; player2_id: string; partner1_id: string | null; partner2_id: string | null };

const noRepeats = (v: MatchPlayers) => {
  const ids = [v.player1_id, v.player2_id, v.partner1_id, v.partner2_id].filter(Boolean);
  return new Set(ids).size === ids.length;
};

export const matchSchema = z
  .object({ game_day_id: id, ...matchPlayers })
  .refine(noRepeats, msg("samePlayer"));

export const matchUpdateSchema = z.object({ id, ...matchPlayers }).refine(noRepeats, msg("samePlayer"));

/** Check the players fit the game day's format. Returns an error key or null. */
export function formatError(format: "singles" | "doubles", v: MatchPlayers): ErrorKey | null {
  if (format === "doubles") return v.partner1_id && v.partner2_id ? null : "doublesNeedsFour";
  return v.partner1_id || v.partner2_id ? "singlesNoPartners" : null;
}

// Games won by one team in the set: blank, or a whole number 0–99.
const games = z
  .string()
  .trim()
  .regex(/^\d{0,2}$/, msg("invalidScore"))
  .optional()
  .transform((s) => (s ? Number(s) : null));

export const resultSchema = z
  .object({
    id,
    result: z.enum(["pending", "player1_win", "player2_win", "draw"], msg("invalidInput")),
    score1: games,
    score2: games,
  })
  // Both teams' games, or neither (the score is optional).
  .refine((v) => (v.score1 === null) === (v.score2 === null), msg("scoreBothTeams"))
  // The winner must have won more games; a draw means equal games.
  .refine((v) => {
    if (v.score1 === null || v.score2 === null || v.result === "pending") return true;
    if (v.result === "draw") return v.score1 === v.score2;
    return v.result === "player1_win" ? v.score1 > v.score2 : v.score2 > v.score1;
  }, msg("scoreMismatch"))
  // Stored as "6-0", Team 1's games first.
  .transform(({ score1, score2, ...rest }) => ({
    ...rest,
    score: score1 === null || score2 === null ? null : `${score1}-${score2}`,
  }));

export const idSchema = z.object({ id });

/** First zod issue message as an ErrorKey. */
export function firstError(error: z.ZodError): ErrorKey {
  const message = error.issues[0]?.message;
  return isErrorKey(message) ? message : "invalidInput";
}
