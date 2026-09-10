export function notFound(req, res, next) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  console.error(err);
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
}
