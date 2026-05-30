import assert from "node:assert/strict";

class DebounceCancelledError extends Error {
  constructor(message = "Debounced call cancelled") {
    super(message);
    this.name = "DebounceCancelledError";
    this.cancelled = true;
  }
}

const isDebounceCancelledError = (error) =>
  error instanceof DebounceCancelledError || error?.cancelled === true;

assert.ok(new DebounceCancelledError() instanceof Error, "DebounceCancelledError is Error");
assert.equal(new DebounceCancelledError("custom").message, "custom", "DebounceCancelledError custom message");
assert.equal(new DebounceCancelledError().cancelled, true, "DebounceCancelledError has cancelled=true");
assert.equal(new DebounceCancelledError().name, "DebounceCancelledError", "DebounceCancelledError name");

assert.equal(isDebounceCancelledError(new DebounceCancelledError()), true, "isDebounceCancelledError detects instance");
assert.equal(isDebounceCancelledError({ cancelled: true }), true, "isDebounceCancelledError detects cancelled flag");
assert.equal(isDebounceCancelledError(new Error()), false, "isDebounceCancelledError rejects regular Error");
assert.equal(isDebounceCancelledError(null), false, "isDebounceCancelledError null");
assert.equal(isDebounceCancelledError(undefined), false, "isDebounceCancelledError undefined");
assert.equal(isDebounceCancelledError({ cancelled: false }), false, "isDebounceCancelledError false cancelled");

const debounceAsync = (asyncFn, delay = 500, options = {}) => {
  const { resolveOnCancel = false, cancelledValue = undefined } = options;
  let timeoutId = null;
  let pendingReject = null;
  let pendingResolve = null;
  let activeAbortController = null;

  const cancelPending = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (activeAbortController) {
      activeAbortController.abort(new DebounceCancelledError());
      activeAbortController = null;
    }
    if (pendingReject || pendingResolve) {
      const cancellation = new DebounceCancelledError();
      if (resolveOnCancel) pendingResolve(cancelledValue);
      else pendingReject(cancellation);
    }
    pendingReject = null;
    pendingResolve = null;
  };

  const debounced = (...args) => {
    cancelPending();
    return new Promise((resolve, reject) => {
      pendingResolve = resolve;
      pendingReject = reject;
      timeoutId = setTimeout(async () => {
        timeoutId = null;
        const currentResolve = pendingResolve;
        const currentReject = pendingReject;
        const controller = new AbortController();
        activeAbortController = controller;
        try {
          const result = await asyncFn(...args, { signal: controller.signal });
          if (activeAbortController === controller) {
            activeAbortController = null;
            if (pendingResolve === currentResolve) {
              pendingResolve = null;
              pendingReject = null;
            }
            currentResolve(result);
          }
        } catch (error) {
          if (activeAbortController === controller) {
            activeAbortController = null;
            if (pendingReject === currentReject) {
              pendingResolve = null;
              pendingReject = null;
            }
            currentReject(error);
          }
        }
      }, delay);
    });
  };

  debounced.cancel = cancelPending;
  debounced.flush = async (...args) => { cancelPending(); return asyncFn(...args); };
  return debounced;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let counter = 0;
const incrementAsync = async (val) => { await delay(20); return ++counter; };

const debouncedIncrement = debounceAsync(incrementAsync, 30);

const r1 = await debouncedIncrement();
assert.equal(r1, 1, "debounceAsync resolves with correct value");

debouncedIncrement.cancel();

const createDebouncedValidator = (validator, delay = 500) =>
  debounceAsync(validator, delay, {
    resolveOnCancel: true,
    cancelledValue: { isValid: false, message: "Validation cancelled", cancelled: true },
  });

const mockValidator = async (val) => {
  await delay(20);
  return { isValid: val.length > 0, message: val.length > 0 ? "valid" : "invalid" };
};

const debouncedValidate = createDebouncedValidator(mockValidator, 30);
const result = await debouncedValidate("test");
assert.equal(result.isValid, true, "createDebouncedValidator resolves validation");
assert.equal(result.cancelled, undefined, "createDebouncedValidator result not cancelled");

console.log("debounceUtils core functions tests passed");