function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const safeMessage =
    status >= 500 ? 'Something went wrong on the server.' : err.message;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ message: safeMessage });
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorHandler, httpError };
