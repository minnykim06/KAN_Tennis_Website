import { describe, expect, it } from "vitest";
import { formatTime, nextRegularDay, todayInPacific } from "./time";

describe("time helpers", () => {
  it("finds the next Thursday on or after a date", () => {
    expect(nextRegularDay("2026-10-18")).toBe("2026-10-22"); // Sun → Thu
    expect(nextRegularDay("2026-10-22")).toBe("2026-10-22"); // Thu → same day
    expect(nextRegularDay("2026-10-23")).toBe("2026-10-29"); // Fri → next Thu
    expect(nextRegularDay("2026-12-30")).toBe("2026-12-31"); // across month end
  });

  it("uses the Pacific date, not UTC", () => {
    // 2026-10-19 05:00 UTC is still Oct 18 in San Diego
    expect(todayInPacific(new Date("2026-10-19T05:00:00Z"))).toBe("2026-10-18");
  });

  it("formats wall-clock times", () => {
    expect(formatTime("19:00:00", "en")).toBe("7:00 PM");
    expect(formatTime("22:00", "ko")).toBe("오후 10:00");
  });
});
