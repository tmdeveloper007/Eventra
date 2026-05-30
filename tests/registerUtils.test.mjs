import assert from "node:assert/strict";

// Mock localStorage globally
const store = {};
globalThis.localStorage = {
  getItem(key) {
    return store[key] || null;
  },
  setItem(key, value) {
    store[key] = String(value);
  },
  clear() {
    for (const key in store) {
      delete store[key];
    }
  }
};

import { isAlreadyRegistered, saveRegistration } from "../src/utils/registerUtils.js";

store["eventRegistrations"] = "";
assert.equal(isAlreadyRegistered("event-1", "user@example.com"), false, "isAlreadyRegistered returns false when no registrations");

saveRegistration("event-1", "User@Example.Com");
assert.equal(isAlreadyRegistered("event-1", "user@example.com"), true, "saveRegistration and isAlreadyRegistered work together");

assert.equal(isAlreadyRegistered("event-1", "USER@EXAMPLE.COM"), true, "isAlreadyRegistered is case-insensitive");

saveRegistration("event-1", "other@example.com");
assert.equal(isAlreadyRegistered("event-1", "other@example.com"), true, "saveRegistration handles multiple emails per event");
assert.equal(isAlreadyRegistered("event-1", "third@example.com"), false, "saveRegistration doesn't add duplicate emails");

saveRegistration("event-2", "third@example.com");
assert.equal(isAlreadyRegistered("event-2", "third@example.com"), true, "saveRegistration handles multiple events");
assert.equal(isAlreadyRegistered("event-1", "third@example.com"), false, "saveRegistration correctly separates events");

store["eventRegistrations"] = "{broken";
assert.equal(isAlreadyRegistered("event-3", "broken@example.com"), false, "isAlreadyRegistered handles corrupted localStorage");

saveRegistration("event-3", "broken@example.com");
assert.equal(isAlreadyRegistered("event-3", "broken@example.com"), true, "saveRegistration works after corrupted data");

assert.equal(isAlreadyRegistered("", "test@example.com"), false, "isAlreadyRegistered returns false for empty eventId");
assert.equal(isAlreadyRegistered("event-1", ""), false, "isAlreadyRegistered returns false for empty email");
assert.equal(isAlreadyRegistered(null, "test@example.com"), false, "isAlreadyRegistered returns false for null eventId");

console.log("registerUtils tests passed ✓");