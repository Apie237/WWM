// Thrown by services/controllers for expected client-facing failures (400,
// 404, etc). The existing Phase 1 errorHandler middleware already reads
// `err.status`, so this class is the only piece needed to produce correct
// HTTP status codes without changing that middleware.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
