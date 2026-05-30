import assert from "node:assert/strict";
import { getUserTimezone, normalizeDateString, parseTimeString, parseEventToUTC, parseEventDateTimeLocal } from "../src/utils/timezoneUtils.js";

assert.equal(typeof getUserTimezone(), "string", "getUserTimezone returns string");

assert.equal(normalizeDateString("2026-05-28"), "2026-05-28", "normalizeDateString YYYY-MM-DD");
assert.equal(normalizeDateString("2026-05-28T10:00:00Z"), "2026-05-28", "normalizeDateString ISO");
assert.equal(normalizeDateString("May 28, 2026"), "2026-05-28", "normalizeDateString long form");
assert.equal(normalizeDateString("invalid"), null, "normalizeDateString invalid");
assert.equal(normalizeDateString(null), null, "normalizeDateString null");
assert.equal(normalizeDateString(""), null, "normalizeDateString empty");

assert.deepEqual(parseTimeString("10:00 AM"), { hours: 10, minutes: 0 }, "parseTimeString AM");
assert.deepEqual(parseTimeString("12:00 PM"), { hours: 12, minutes: 0 }, "parseTimeString noon");
assert.deepEqual(parseTimeString("12:00 AM"), { hours: 0, minutes: 0 }, "parseTimeString midnight");
assert.deepEqual(parseTimeString("9:30 PM"), { hours: 21, minutes: 30 }, "parseTimeString PM evening");
assert.deepEqual(parseTimeString("11:59 AM"), { hours: 11, minutes: 59 }, "parseTimeString before noon");
assert.deepEqual(parseTimeString("22:30"), { hours: 22, minutes: 30 }, "parseTimeString 24hr");
assert.deepEqual(parseTimeString("00:00"), { hours: 0, minutes: 0 }, "parseTimeString midnight 24hr");
assert.deepEqual(parseTimeString("23:59"), { hours: 23, minutes: 59 }, "parseTimeString 23:59");
assert.equal(parseTimeString("invalid"), null, "parseTimeString invalid");
assert.equal(parseTimeString(null), null, "parseTimeString null");
assert.equal(parseTimeString(""), null, "parseTimeString empty");

const utcTime = parseEventToUTC("2026-05-28", "10:00 AM", "UTC");
assert.equal(typeof utcTime, "number", "parseEventToUTC returns number");
assert.ok(utcTime > 0, "parseEventToUTC positive timestamp");

const utcTime24 = parseEventToUTC("2026-05-28", "22:30", "UTC");
assert.equal(typeof utcTime24, "number", "parseEventToUTC 24hr format");

assert.equal(parseEventToUTC("invalid", "10:00 AM", "UTC"), null, "parseEventToUTC invalid date");
assert.equal(parseEventToUTC("2026-05-28", "invalid", "UTC"), null, "parseEventToUTC invalid time");

const local = parseEventDateTimeLocal("2026-05-28", "10:00 AM");
assert.ok(local instanceof Date, "parseEventDateTimeLocal returns Date");
assert.equal(local.getHours(), 10, "parseEventDateTimeLocal correct hour");
assert.equal(local.getMinutes(), 0, "parseEventDateTimeLocal correct minute");

const local24 = parseEventDateTimeLocal("2026-05-28", "22:30");
assert.equal(local24.getHours(), 22, "parseEventDateTimeLocal 24hr hour");

assert.ok(parseEventDateTimeLocal("invalid", "10:00 AM") === null, "parseEventDateTimeLocal invalid date");
assert.ok(parseEventDateTimeLocal("2026-05-28", "invalid") === null, "parseEventDateTimeLocal invalid time");

console.log("timezoneUtils tests passed ✓");