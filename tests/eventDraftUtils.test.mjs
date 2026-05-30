import assert from "node:assert/strict";

// Mock localStorage globally
let store = {};
let throwError = false;

globalThis.localStorage = {
  getItem(key) {
    if (throwError) throw new Error("Storage simulated error");
    return store[key] || null;
  },
  setItem(key, value) {
    if (throwError) throw new Error("Storage simulated error");
    store[key] = String(value);
  },
  removeItem(key) {
    if (throwError) throw new Error("Storage simulated error");
    delete store[key];
  }
};

import { saveDraft, getDraft, clearDraft } from "../src/utils/eventDraftUtils.js";

assert.equal(getDraft(), null, "getDraft returns null when no draft saved");

const draftData = { title: "Super Hackathon", description: "Awesome builders event" };
saveDraft(draftData);
assert.deepEqual(getDraft(), draftData, "getDraft returns saved draft");

clearDraft();
assert.equal(getDraft(), null, "getDraft returns null after clearDraft");

const complexDraft = {
  title: "Test Event",
  description: "Description with special chars: {}[],.;'\"",
  maxAttendees: 100,
  price: 50,
  categories: ["Web Development", "DevOps"]
};
saveDraft(complexDraft);
assert.deepEqual(getDraft(), complexDraft, "saveDraft handles complex data");

saveDraft({});
assert.deepEqual(getDraft(), {}, "saveDraft handles empty object");

throwError = true;
assert.equal(getDraft(), null, "getDraft returns null on storage error");
saveDraft(draftData);
assert.equal(getDraft(), null, "getDraft returns null after saveDraft error");
clearDraft();

console.log("eventDraftUtils tests passed ✓");