import assert from "node:assert/strict";
import {
  filterByCategory,
  filterByMode,
  filterByPrice,
  filterByDateRange,
  filterByStatus,
  applyAdvancedFilters,
  getUniqueCategories,
  getPriceStats,
  getDateRange,
  hasActiveFilters,
  getDefaultFilters
} from "../src/utils/advancedFilterUtils.js";

const events = [
  { id: 1, title: "Web Dev", category: "Web Development", eventMode: "online", price: 0, status: "live", date: "2026-05-28" },
  { id: 2, title: "AI Summit", category: "AI & Machine Learning", eventMode: "offline", price: 100, status: "upcoming", date: "2026-06-15" },
  { id: 3, title: "DevOps Conf", category: "DevOps & Cloud", eventMode: "hybrid", price: 250, status: "upcoming", date: "2026-07-01" },
  { id: 4, title: "Security Workshop", category: "Security & Privacy", eventMode: "offline", price: 150, status: "upcoming", date: "2026-08-10" }
];

assert.equal(filterByCategory(events, ["web-development"]).length, 1, "filterByCategory selects by category");
assert.equal(filterByCategory(events, ["web-development", "security-privacy"]).length, 2, "filterByCategory multiple categories");
assert.equal(filterByCategory(events, []).length, 4, "filterByCategory empty returns all");
assert.equal(filterByCategory(events, ["nonexistent"]).length, 0, "filterByCategory no match");
assert.equal(filterByCategory([], ["web-development"]).length, 0, "filterByCategory empty events");

assert.equal(filterByMode(events, ["online"]).length, 1, "filterByMode selects online");
assert.equal(filterByMode(events, ["online", "offline"]).length, 3, "filterByMode multiple modes");
assert.equal(filterByMode(events, []).length, 4, "filterByMode empty returns all");
assert.equal(filterByMode([], ["online"]).length, 0, "filterByMode empty events");

assert.equal(filterByPrice(events, { min: 0, max: 50 }).length, 1, "filterByPrice free events");
assert.equal(filterByPrice(events, { min: 100, max: 200 }).length, 2, "filterByPrice range 100-200");
assert.equal(filterByPrice(events, null).length, 4, "filterByPrice null returns all");
assert.equal(filterByPrice(events, { min: 0, max: 0 }).length, 1, "filterByPrice free tier");
assert.equal(filterByPrice([], { min: 0, max: 100 }).length, 0, "filterByPrice empty events");

const startDate = new Date("2026-06-01");
const endDate = new Date("2026-06-30");
const filtered = filterByDateRange(events, { startDate, endDate });
assert.equal(filtered.length, 1, "filterByDateRange single month");
assert.equal(filtered[0].id, 2, "filterByDateRange correct event");

const filteredAll = filterByDateRange(events, null);
assert.equal(filteredAll.length, 4, "filterByDateRange null returns all");

const filteredNoEnd = filterByDateRange(events, { startDate: new Date("2026-05-01") });
assert.equal(filteredNoEnd.length, 4, "filterByDateRange no end returns all");

const filteredNoStart = filterByDateRange(events, { endDate: new Date("2099-12-31") });
assert.equal(filteredNoStart.length, 4, "filterByDateRange no start returns all");

const filteredBothNull = filterByDateRange(events, { startDate: null, endDate: null });
assert.equal(filteredBothNull.length, 4, "filterByDateRange both null returns all");

const filteredFuture = filterByDateRange(events, { startDate: new Date("2026-07-01") });
assert.equal(filteredFuture.length, 2, "filterByDateRange future start");

const filteredPast = filterByDateRange(events, { endDate: new Date("2026-05-29") });
assert.equal(filteredPast.length, 1, "filterByDateRange past end");

assert.equal(filterByStatus(events, ["live"]).length, 1, "filterByStatus live only");
assert.equal(filterByStatus(events, ["upcoming"]).length, 3, "filterByStatus upcoming");
assert.equal(filterByStatus(events, []).length, 4, "filterByStatus empty returns all");
assert.equal(filterByStatus([], ["live"]).length, 0, "filterByStatus empty events");

const combined = applyAdvancedFilters(events, {
  categories: ["web-development"],
  modes: ["online"],
  statuses: ["live", "upcoming"]
});
assert.equal(combined.length, 1, "applyAdvancedFilters combined filters");

const combinedNull = applyAdvancedFilters(events, null);
assert.equal(combinedNull.length, 4, "applyAdvancedFilters null returns all");

const combinedEmpty = applyAdvancedFilters(events, {});
assert.equal(combinedEmpty.length, 4, "applyAdvancedFilters empty returns all");

const unique = getUniqueCategories(events);
assert.deepEqual(unique, ["AI & Machine Learning", "DevOps & Cloud", "Security & Privacy", "Web Development"], "getUniqueCategories sorted");

const noCatEvents = [{ id: 1 }, { id: 2 }];
const emptyUnique = getUniqueCategories(noCatEvents);
assert.deepEqual(emptyUnique, [], "getUniqueCategories no categories");

const stats = getPriceStats(events);
assert.equal(stats.min, 0, "getPriceStats min");
assert.equal(stats.max, 250, "getPriceStats max");
assert.equal(stats.average, 125, "getPriceStats average");

const noPriceEvents = [{ id: 1 }, { id: 2 }];
const emptyStats = getPriceStats(noPriceEvents);
assert.deepEqual(emptyStats, { min: 0, max: 0, average: 0 }, "getPriceStats empty events");

const range = getDateRange(events);
assert.ok(range.earliest instanceof Date, "getDateRange earliest is Date");
assert.ok(range.latest instanceof Date, "getDateRange latest is Date");

const noDateEvents = [];
const emptyRange = getDateRange(noDateEvents);
assert.ok(emptyRange.earliest instanceof Date, "getDateRange empty events earliest");
assert.ok(emptyRange.latest instanceof Date, "getDateRange empty events latest");

assert.equal(hasActiveFilters({ categories: ["ai"] }), true, "hasActiveFilters categories");
assert.equal(hasActiveFilters({ modes: ["online"] }), true, "hasActiveFilters modes");
assert.equal(hasActiveFilters({ statuses: ["live"] }), true, "hasActiveFilters statuses");
assert.equal(hasActiveFilters({ priceRange: { min: 10, max: 100 } }), true, "hasActiveFilters priceRange");
assert.equal(hasActiveFilters({ dateRange: { startDate: new Date() } }), true, "hasActiveFilters dateRange");
assert.equal(hasActiveFilters({ categories: [], modes: [], statuses: [] }), false, "hasActiveFilters empty arrays");
assert.equal(hasActiveFilters({}), false, "hasActiveFilters empty object");
assert.equal(hasActiveFilters(null), false, "hasActiveFilters null");

const defaults = getDefaultFilters();
assert.deepEqual(defaults.categories, [], "getDefaultFilters categories");
assert.deepEqual(defaults.modes, [], "getDefaultFilters modes");
assert.deepEqual(defaults.statuses, [], "getDefaultFilters statuses");
assert.equal(defaults.priceRange, null, "getDefaultFilters priceRange");
assert.equal(defaults.dateRange, null, "getDefaultFilters dateRange");

console.log("advancedFilterUtils tests passed ✓");