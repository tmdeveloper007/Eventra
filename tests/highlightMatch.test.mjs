import assert from "node:assert/strict";

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

assert.equal(escapeRegex("C++"), "C\\+\\+", "escapeRegex C++");
assert.equal(escapeRegex("Regex [cool]"), "Regex \\[cool\\]", "escapeRegex brackets");
assert.equal(escapeRegex("$10"), "\\$10", "escapeRegex dollar");
assert.equal(escapeRegex("(a+)+$"), "\\(a\\+\\)\\+\\$", "escapeRegex complex regex");
assert.equal(escapeRegex("test.word"), "test\\.word", "escapeRegex dot");
assert.equal(escapeRegex("a+b*c?"), "a\\+b\\*c\\?", "escapeRegex quantifiers");
assert.equal(escapeRegex("^start$"), "\\^start\\$", "escapeRegex anchors");
assert.equal(escapeRegex(""), "", "escapeRegex empty string");
assert.equal(escapeRegex("no special chars"), "no special chars", "escapeRegex no special");

const regex1 = new RegExp(escapeRegex("C++"), "gi");
const parts1 = "C++ programming".split(regex1);
assert.equal(parts1.length, 2, "escapeRegex works in RegExp for C++");

const regex2 = new RegExp(escapeRegex("(a+)+$"), "gi");
const parts2 = "test (a+)+$ string".split(regex2);
assert.equal(parts2.length, 2, "escapeRegex works for complex patterns");

console.log("highlightMatch tests passed ✓");