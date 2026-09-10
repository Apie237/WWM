// Wraps an async Express handler so a rejected promise (e.g. an ApiError
// thrown from a service) is forwarded to next(err) instead of crashing the
// process, letting the existing Phase 1 errorHandler middleware handle it.
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
