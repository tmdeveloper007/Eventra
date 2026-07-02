/**
 * Returns true if the input string looks like a valid date that can be parsed.
 * Guards against strings like "invalid", "0000-00-00", or empty strings that
 * may pass the `if (!eventDate)` check but still produce Invalid Date objects.
 */
const isValidDateString = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;
  const d = new Date(value);
  // new Date("0000-00-00") returns Invalid Date in some environments,
  // but its getTime() is NaN — guard against that.
  return !isNaN(d.getTime());
};

export function getCountdown(eventDate) {
  if (!eventDate || typeof eventDate === "undefined") {
    return { status: "UPCOMING", text: "Date TBD" };
  }

  // Guard: if eventDate is not a recognisable date string, return TBD
  if (!isValidDateString(eventDate)) {
    return { status: "UPCOMING", text: "Date TBD" };
  }

  const now = new Date().getTime();
  const target = new Date(eventDate).getTime();

  if (isNaN(target)) {
    return { status: "UPCOMING", text: "Date TBD" };
  }

  const diff = target - now;

  if (diff <= 0) {
    // Differentiate "just ended" from "ended N ago" for stale events
    const absDiffMs = Math.abs(diff);
    const absDiffMin = Math.round(absDiffMs / (1000 * 60));
    const absDiffHr = Math.round(absDiffMs / (1000 * 60 * 60));
    const absDiffDay = Math.round(absDiffMs / (1000 * 60 * 60 * 24));

    if (absDiffMin < 1) {
      return { status: "ENDED", text: "Just ended" };
    }
    if (absDiffMin < 60) {
      return { status: "ENDED", text: `Ended ${absDiffMin} min ago` };
    }
    if (absDiffHr < 24) {
      return { status: "ENDED", text: `Ended ${absDiffHr} hour${absDiffHr !== 1 ? "s" : ""} ago` };
    }
    if (absDiffDay === 1) {
      return { status: "ENDED", text: "Ended yesterday" };
    }
    return { status: "ENDED", text: `Ended ${absDiffDay} days ago` };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return {
    status: "UPCOMING",
    text:
      days > 0
        ? `Starts in: ${days} Day${days !== 1 ? "s" : ""} ${hours} Hour${hours !== 1 ? "s" : ""}`
        : `Starts in: ${hours} Hour${hours !== 1 ? "s" : ""} ${minutes} Minute${minutes !== 1 ? "s" : ""}`,
  };
}
