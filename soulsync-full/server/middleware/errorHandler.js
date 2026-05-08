// server/middleware/errorHandler.js
export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  if (process.env.NODE_ENV !== 'production') {
    console.error('\n❌', err.message);
    console.error(err.stack);
  }
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
