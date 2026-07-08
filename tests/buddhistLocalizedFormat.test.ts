import { beforeEach, describe, expect, it } from "vitest";
import dayjs from "dayjs";
import "dayjs/locale/th";
import "dayjs/locale/en";
import buddhistLocalizedFormat, {
  expandLocalizedTokens,
  toBuddhistEraYear,
  withBracketsProtected,
} from "../src/index";

dayjs.extend(buddhistLocalizedFormat, { buddhistLocales: ["th"] });

// Fixed instant so every assertion is deterministic regardless of when tests run.
const SAMPLE = "2026-07-07T14:30:05";

beforeEach(() => {
  dayjs.locale("en");
});

describe("Locale-aware Buddhist Era formatting", () => {
  it("uses the Gregorian year by default on a non-Buddhist locale (en)", () => {
    dayjs.locale("en");
    expect(dayjs(SAMPLE).format("YYYY")).toBe("2026");
  });

  it("automatically converts to B.E. (+543) when locale is th", () => {
    dayjs.locale("th");
    expect(dayjs(SAMPLE).format("YYYY")).toBe("2569");
  });

  it("converts the 2-digit year (YY) using the B.E. year, not the Gregorian year", () => {
    dayjs.locale("th");
    // B.E. 2569 -> last two digits "69" (not "26", which is Gregorian 2026's last two digits)
    expect(dayjs(SAMPLE).format("YY")).toBe("69");
  });

  it("respects a custom list of Buddhist-Era locales", () => {
    dayjs.extend(buddhistLocalizedFormat, { buddhistLocales: ["th", "xx"] });
    dayjs.locale("en"); // still Gregorian, 'en' was never in the list
    expect(dayjs(SAMPLE).format("YYYY")).toBe("2026");
  });
});

describe("LocalizedFormat token support", () => {
  it("expands L (short date) using the active locale", () => {
    dayjs.locale("en");
    expect(dayjs(SAMPLE).format("L")).toBe("07/07/2026");

    dayjs.locale("th");
    expect(dayjs(SAMPLE).format("L")).toBe("07/07/2569");
  });

  it("expands LT (short time)", () => {
    dayjs.locale("en");
    expect(dayjs(SAMPLE).format("LT")).toBe("2:30 PM");

    dayjs.locale("th");
    expect(dayjs(SAMPLE).format("LT")).toBe("14:30");
  });

  it("expands LL (long date) with the B.E. year on th", () => {
    dayjs.locale("th");
    expect(dayjs(SAMPLE).format("LL")).toBe("7 กรกฎาคม 2569");
  });

  it("expands LLLL (full date + weekday + time) with the B.E. year on th", () => {
    dayjs.locale("th");
    expect(dayjs(SAMPLE).format("LLLL")).toBe(
      "วันอังคารที่ 7 กรกฎาคม 2569 เวลา 14:30",
    );
  });

  it("falls back to English defaults when a locale has no formats object", () => {
    dayjs.locale("en");
    expect(dayjs(SAMPLE).format("LLL")).toBe("July 7, 2026 2:30 PM");
  });
});

describe("Dynamic { be } toggle overriding the locale default", () => {
  it("force-disables B.E. on a Buddhist locale", () => {
    dayjs.locale("th");
    expect(dayjs(SAMPLE).format("L LT", { be: false })).toBe(
      "07/07/2026 14:30",
    );
  });

  it("force-enables B.E. on a non-Buddhist locale", () => {
    dayjs.locale("en");
    expect(dayjs(SAMPLE).format("LL", { be: true })).toBe("July 7, 2569");
  });

  it("omitting the options object preserves locale-default behavior", () => {
    dayjs.locale("th");
    expect(dayjs(SAMPLE).format("YYYY")).toBe("2569");
    dayjs.locale("en");
    expect(dayjs(SAMPLE).format("YYYY")).toBe("2026");
  });
});

describe("Literal bracket escapes are never rewritten", () => {
  it("leaves [L], [Y], and other quoted literals untouched while still formatting real tokens", () => {
    dayjs.locale("th");
    expect(dayjs(SAMPLE).format("[Year (B.E.):] YYYY [—not a token]")).toBe(
      "Year (B.E.): 2569 —not a token",
    );
  });

  it("does not expand localized tokens hidden inside brackets", () => {
    dayjs.locale("en");
    expect(dayjs(SAMPLE).format("[L] YYYY")).toBe("L 2026");
  });
});

describe("Internal helpers (unit-level)", () => {
  it("withBracketsProtected hides and restores bracketed literals", () => {
    const result = withBracketsProtected("[keep] YYYY", (s) =>
      s.replace(/YYYY/g, "X"),
    );
    expect(result).toBe("[keep] X");
  });

  it("expandLocalizedTokens expands LLLL using provided locale formats", () => {
    const result = expandLocalizedTokens("LLLL", {
      LLLL: "dddd D MMMM YYYY",
    });
    expect(result).toBe("dddd D MMMM YYYY");
  });

  it("toBuddhistEraYear swaps YYYY and YY for the supplied B.E. year", () => {
    expect(toBuddhistEraYear("YYYY/YY", 2569)).toBe("2569/69");
  });
});
