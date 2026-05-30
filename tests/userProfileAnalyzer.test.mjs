import assert from "node:assert/strict";

const store = {};
globalThis.localStorage = {
  getItem(key) { return store[key] || null; },
  setItem(key, value) { store[key] = String(value); },
  removeItem(key) { delete store[key]; }
};

const getUserProfile = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("eventra_user_profile")) || {};
    return {
      interests: saved.interests || [],
      techStack: saved.techStack || [],
      eventTypes: saved.eventTypes || [],
      level: saved.level || "Beginner",
    };
  } catch {
    return {
      interests: [],
      techStack: [],
      eventTypes: [],
      level: "Beginner",
    };
  }
};

const profile1 = getUserProfile();
assert.deepEqual(profile1.interests, [], "getUserProfile returns empty arrays when no data");
assert.deepEqual(profile1.techStack, [], "getUserProfile techStack defaults to empty");
assert.deepEqual(profile1.eventTypes, [], "getUserProfile eventTypes defaults to empty");
assert.equal(profile1.level, "Beginner", "getUserProfile level defaults to Beginner");

store["eventra_user_profile"] = JSON.stringify({ interests: ["AI", "Web"] });
const profile2 = getUserProfile();
assert.deepEqual(profile2.interests, ["AI", "Web"], "getUserProfile reads interests");
assert.deepEqual(profile2.techStack, [], "getUserProfile partial data fills missing fields");

store["eventra_user_profile"] = JSON.stringify({
  interests: ["DevOps"],
  techStack: ["Kubernetes", "Docker"],
  eventTypes: ["Conference"],
  level: "Advanced"
});
const profile3 = getUserProfile();
assert.deepEqual(profile3.interests, ["DevOps"], "getUserProfile reads all fields");
assert.deepEqual(profile3.techStack, ["Kubernetes", "Docker"], "getUserProfile reads techStack");
assert.deepEqual(profile3.eventTypes, ["Conference"], "getUserProfile reads eventTypes");
assert.equal(profile3.level, "Advanced", "getUserProfile reads level");

delete store["eventra_user_profile"];
const profile4 = getUserProfile();
assert.deepEqual(profile4.interests, [], "getUserProfile handles missing key");
assert.equal(profile4.level, "Beginner", "getUserProfile handles missing key");

store["eventra_user_profile"] = "not-json";
const profile5 = getUserProfile();
assert.deepEqual(profile5.interests, [], "getUserProfile handles corrupted JSON");
assert.equal(profile5.level, "Beginner", "getUserProfile handles corrupted JSON");

delete store["eventra_user_profile"];

console.log("userProfileAnalyzer core functions tests passed");