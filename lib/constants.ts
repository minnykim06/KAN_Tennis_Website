export const INSTAGRAM_URL = "https://www.instagram.com/kantennis_/";
export const TIME_ZONE = "America/Los_Angeles";

/** The club's regular schedule, used to prefill new game days. */
export const REGULAR_SCHEDULE = {
  weekday: 4, // Thursday (ISO: Mon=1 … Sun=7)
  startTime: "19:00",
  endTime: "22:00",
  location: "Muir Tennis Courts",
  format: "doubles",
} as const;
