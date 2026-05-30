import assert from "node:assert/strict";

class FetchError extends Error {
  constructor(message, status = null, data = null) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.data = data;
  }
}

assert.ok(new FetchError("test") instanceof Error, "FetchError is Error");
assert.equal(new FetchError("test").name, "FetchError", "FetchError name");
assert.equal(new FetchError("test", 404).status, 404, "FetchError status");
assert.equal(new FetchError("test", null, { info: "data" }).data.info, "data", "FetchError data");
assert.equal(new FetchError("msg", 500).message, "msg", "FetchError message");

const DEFAULT_TIMEOUT = 10000;

const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const handleUserAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", handleUserAbort);
  }
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    let data = null;
    try { data = await response.clone().json(); }
    catch { data = await response.text().catch(() => null); }
    if (!response.ok) throw new FetchError(data?.message || `Request failed with status ${response.status}`, response.status, data);
    return { response, data };
  } catch (error) {
    if (error.name === "AbortError") throw new FetchError(`Request timed out after ${timeout}ms or was manually aborted`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (options.signal) options.signal.removeEventListener("abort", handleUserAbort);
  }
};

assert.equal(typeof fetchWithTimeout, "function", "fetchWithTimeout is a function");

const originalFetch = globalThis.fetch;

let mockResponse;
globalThis.fetch = async (url, options) => {
  if (!mockResponse) mockResponse = { ok: true, status: 200, clone: () => ({ json: async () => ({ ok: true }) }), text: async () => "" };
  return mockResponse;
};

const result1 = await fetchWithTimeout("http://example.com/api");
assert.equal(result1.data.ok, true, "fetchWithTimeout returns data on success");

mockResponse = {
  ok: true,
  status: 200,
  clone: () => {
    return {
      json: async () => { throw new Error("json parse error"); }
    };
  },
  text: async () => "plain text response"
};

const result2 = await fetchWithTimeout("http://example.com/text", {}, 5000);
assert.equal(result2.data, "plain text response", "fetchWithTimeout falls back to text when JSON fails");

globalThis.fetch = originalFetch;

console.log("fetchWithTimeout core functions tests passed");