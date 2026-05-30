import assert from "node:assert/strict";

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

const parseEventDate = (event) => {
  if (!event) return null;
  const dateString = event.startDate || event.date || event.eventDate;
  if (!dateString) return null;
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDaysUntilEvent = (event) => {
  const eventDate = parseEventDate(event);
  if (!eventDate) return null;
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
};

const getCapacityUtilization = (event) => {
  const attendees = Number(event.attendees || 0);
  const capacity = Number(event.maxAttendees || event.capacity || 0);
  if (capacity <= 0) return 0;
  return clamp01(attendees / capacity);
};

const getTicketTypeScore = (event) => {
  if (event.price === 0 || event.price === "0" || String(event.price).trim() === "") return 0.92;
  const price = Number(event.price);
  if (Number.isNaN(price)) return 0.75;
  if (price <= 50) return 0.88;
  if (price <= 150) return 0.8;
  if (price <= 300) return 0.72;
  return 0.62;
};

const getEventModeScore = (eventMode) => {
  if (!eventMode) return 0.75;
  const mode = String(eventMode).trim().toLowerCase();
  if (mode === "online") return 0.92;
  if (mode === "hybrid") return 0.86;
  return 0.72;
};

const getProximityScore = (event) => {
  const days = getDaysUntilEvent(event);
  if (days === null) return 0.72;
  if (days <= 1) return 0.94;
  if (days <= 4) return 0.88;
  if (days <= 10) return 0.8;
  if (days <= 30) return 0.72;
  if (days <= 90) return 0.64;
  return 0.56;
};

assert.equal(clamp01(0.5), 0.5, "clamp01 returns value within 0-1");
assert.equal(clamp01(-5), 0, "clamp01 clamps negative to 0");
assert.equal(clamp01(2), 1, "clamp01 clamps above 1 to 1");
assert.equal(clamp01("invalid"), 0, "clamp01 handles invalid input");

assert.equal(parseEventDate(null), null, "parseEventDate returns null for null");
assert.equal(parseEventDate({}), null, "parseEventDate returns null when no date field");
assert.ok(parseEventDate({ date: "2026-06-15" }) instanceof Date, "parseEventDate parses valid date");
assert.equal(parseEventDate({ date: "invalid" }), null, "parseEventDate returns null for invalid date");
assert.ok(parseEventDate({ startDate: "2026-06-15" }) instanceof Date, "parseEventDate uses startDate");
assert.ok(parseEventDate({ eventDate: "2026-06-15" }) instanceof Date, "parseEventDate uses eventDate");

const futureEvent = { date: "2030-06-15" };
const days = getDaysUntilEvent(futureEvent);
assert.equal(typeof days, "number", "getDaysUntilEvent returns number");
assert.ok(days >= 0, "getDaysUntilEvent returns non-negative");

assert.equal(getDaysUntilEvent(null), null, "getDaysUntilEvent returns null for null event");
assert.equal(getDaysUntilEvent({}), null, "getDaysUntilEvent returns null for event without date");

assert.equal(getCapacityUtilization({ attendees: 50, maxAttendees: 100 }), 0.5, "getCapacityUtilization calculates correct ratio");
assert.equal(getCapacityUtilization({ attendees: 100, maxAttendees: 100 }), 1, "getCapacityUtilization returns 1 at full");
assert.equal(getCapacityUtilization({ attendees: 0, maxAttendees: 100 }), 0, "getCapacityUtilization returns 0 for zero attendees");
assert.equal(getCapacityUtilization({ attendees: 50, capacity: 100 }), 0.5, "getCapacityUtilization uses capacity field");
assert.equal(getCapacityUtilization({ attendees: 50 }), 0, "getCapacityUtilization handles zero capacity");
assert.equal(getCapacityUtilization({}), 0, "getCapacityUtilization handles missing capacity");

assert.equal(getTicketTypeScore({ price: 0 }), 0.92, "getTicketTypeScore free event");
assert.equal(getTicketTypeScore({ price: "0" }), 0.92, "getTicketTypeScore string zero price");
assert.equal(getTicketTypeScore({ price: "" }), 0.92, "getTicketTypeScore empty price");
assert.equal(getTicketTypeScore({ price: 50 }), 0.88, "getTicketTypeScore <= 50");
assert.equal(getTicketTypeScore({ price: 100 }), 0.8, "getTicketTypeScore <= 150");
assert.equal(getTicketTypeScore({ price: 250 }), 0.72, "getTicketTypeScore <= 300");
assert.equal(getTicketTypeScore({ price: 500 }), 0.62, "getTicketTypeScore > 300");
assert.equal(getTicketTypeScore({ price: "invalid" }), 0.75, "getTicketTypeScore NaN returns 0.75");
assert.equal(getTicketTypeScore({}), 0.75, "getTicketTypeScore missing price");

assert.equal(getEventModeScore("online"), 0.92, "getEventModeScore online");
assert.equal(getEventModeScore("ONLINE"), 0.92, "getEventModeScore uppercase online");
assert.equal(getEventModeScore("hybrid"), 0.86, "getEventModeScore hybrid");
assert.equal(getEventModeScore("offline"), 0.72, "getEventModeScore offline");
assert.equal(getEventModeScore(""), 0.75, "getEventModeScore empty string");
assert.equal(getEventModeScore(null), 0.75, "getEventModeScore null");

const pastEvent = { date: "2020-01-01" };
const daysPast = getDaysUntilEvent(pastEvent);
assert.equal(daysPast, 0, "getDaysUntilEvent past event returns 0");
assert.equal(getProximityScore(pastEvent), 0.94, "getProximityScore past/future event within 1 day");
assert.equal(getProximityScore({}), 0.72, "getProximityScore missing date");
assert.equal(getProximityScore(null), 0.72, "getProximityScore null event");

console.log("attendancePrediction core functions tests passed");