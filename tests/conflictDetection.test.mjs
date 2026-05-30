import assert from "node:assert/strict";

const getEffectiveDuration = (event, fallbackMinutes = 60) => {
  const d = event?.durationMinutes;
  return typeof d === 'number' && d > 0 ? d : fallbackMinutes;
};

const parseTimeString = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim();
  const amPmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = parseInt(amPmMatch[2], 10);
    const period = amPmMatch[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  }
  const h24Match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match) {
    return { hours: parseInt(h24Match[1], 10), minutes: parseInt(h24Match[2], 10) };
  }
  return null;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parsed = parseTimeString(timeStr);
  if (!parsed) return 0;
  return parsed.hours * 60 + parsed.minutes;
};

assert.equal(getEffectiveDuration({}, 60), 60, "getEffectiveDuration fallback when no durationMinutes");
assert.equal(getEffectiveDuration({ durationMinutes: 0 }, 60), 60, "getEffectiveDuration zero returns fallback");
assert.equal(getEffectiveDuration({ durationMinutes: 120 }), 120, "getEffectiveDuration returns durationMinutes");
assert.equal(getEffectiveDuration({ durationMinutes: 45 }, 90), 45, "getEffectiveDuration prefers durationMinutes over fallback");
assert.equal(getEffectiveDuration(null, 30), 30, "getEffectiveDuration null event uses fallback");
assert.equal(getEffectiveDuration({ durationMinutes: -5 }, 60), 60, "getEffectiveDuration negative returns fallback");

assert.equal(parseTimeToMinutes("10:00 AM"), 600, "parseTimeToMinutes 10:00 AM");
assert.equal(parseTimeToMinutes("12:00 PM"), 720, "parseTimeToMinutes noon");
assert.equal(parseTimeToMinutes("12:00 AM"), 0, "parseTimeToMinutes midnight");
assert.equal(parseTimeToMinutes("9:30 PM"), 1290, "parseTimeToMinutes 9:30 PM");
assert.equal(parseTimeToMinutes("11:59 AM"), 719, "parseTimeToMinutes 11:59 AM");
assert.equal(parseTimeToMinutes("14:30"), 870, "parseTimeToMinutes 24hr");
assert.equal(parseTimeToMinutes("00:00"), 0, "parseTimeToMinutes 00:00");
assert.equal(parseTimeToMinutes("23:59"), 1439, "parseTimeToMinutes 23:59");
assert.equal(parseTimeToMinutes(""), 0, "parseTimeToMinutes empty");
assert.equal(parseTimeToMinutes(null), 0, "parseTimeToMinutes null");
assert.equal(parseTimeToMinutes("invalid"), 0, "parseTimeToMinutes invalid");

const getEventUTCRange = (event, fallbackDuration = 60, timezone) => {
  if (!event) return null;
  if (!event.date || !event.time) return null;
  const parsedTime = parseTimeString(event.time);
  if (!parsedTime) return null;
  const date = new Date(event.date);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
  const startMs = date.getTime();
  const durationMs = getEffectiveDuration(event, fallbackDuration) * 60 * 1000;
  return { startMs, endMs: startMs + durationMs };
};

const doEventsOverlap = (event1, event2, fallbackDuration = 60, timezone) => {
  const range1 = getEventUTCRange(event1, fallbackDuration);
  const range2 = getEventUTCRange(event2, fallbackDuration);
  if (range1 && range2) {
    return !(range1.endMs <= range2.startMs || range2.endMs <= range1.startMs);
  }
  if (event1?.date !== event2?.date) return false;
  const r1 = { startMinutes: parseTimeToMinutes(event1?.time), endMinutes: parseTimeToMinutes(event1?.time) + getEffectiveDuration(event1, fallbackDuration) };
  const r2 = { startMinutes: parseTimeToMinutes(event2?.time), endMinutes: parseTimeToMinutes(event2?.time) + getEffectiveDuration(event2, fallbackDuration) };
  return r1.startMinutes < r2.endMinutes && r1.endMinutes > r2.startMinutes;
};

const e1 = { date: "2026-06-15", time: "10:00 AM", durationMinutes: 60 };
const e2 = { date: "2026-06-15", time: "11:00 AM", durationMinutes: 60 };
const e3 = { date: "2026-06-15", time: "10:30 AM", durationMinutes: 60 };
const e4 = { date: "2026-06-16", time: "10:00 AM", durationMinutes: 60 };
const e5 = { date: "2026-06-15", time: "2:00 PM", durationMinutes: 60 };

const range1 = getEventUTCRange(e1);
assert.equal(typeof range1.startMs, "number", "getEventUTCRange returns startMs");
assert.equal(typeof range1.endMs, "number", "getEventUTCRange returns endMs");
assert.ok(range1.endMs > range1.startMs, "getEventUTCRange end > start");

assert.equal(getEventUTCRange(null), null, "getEventUTCRange null event");
assert.equal(getEventUTCRange({ date: "2026-06-15" }), null, "getEventUTCRange missing time");

assert.equal(doEventsOverlap(e1, e2), false, "doEventsOverlap back-to-back same day no overlap");
assert.equal(doEventsOverlap(e1, e3), true, "doEventsOverlap same day overlapping times");
assert.equal(doEventsOverlap(e1, e4), false, "doEventsOverlap different days");
assert.equal(doEventsOverlap(e1, e5), false, "doEventsOverlap non-overlapping same day");

const findConflictingEvents = (newEvent, registeredEvents, fallbackDuration = 60, timezone) => {
  if (!registeredEvents || registeredEvents.length === 0) return [];
  return registeredEvents.map(reg => reg.event || reg).filter(event => doEventsOverlap(newEvent, event, fallbackDuration, timezone));
};

const registered = [
  { event: { date: "2026-06-15", time: "9:30 AM", durationMinutes: 60 } },
  { event: { date: "2026-06-16", time: "10:00 AM", durationMinutes: 60 } }
];
const conflicts = findConflictingEvents({ date: "2026-06-15", time: "10:00 AM", durationMinutes: 60 }, registered);
assert.equal(conflicts.length, 1, "findConflictingEvents finds 1 conflict");

const noConflicts = findConflictingEvents({ date: "2026-06-20", time: "10:00 AM", durationMinutes: 60 }, registered);
assert.equal(noConflicts.length, 0, "findConflictingEvents no conflicts");

assert.deepEqual(findConflictingEvents({ date: "2026-06-15", time: "10:00 AM" }, []), [], "findConflictingEvents empty list");

console.log("conflictDetection core functions tests passed");