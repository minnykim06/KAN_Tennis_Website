export type Theme = "light" | "dark";

/** Cookie holding the member's choice. Missing = follow the device setting. */
export const THEME_COOKIE = "theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}
