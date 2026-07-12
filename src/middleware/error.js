export function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.name, err.message);
  if (err.$metadata) {
    console.error('[S3 Error]', JSON.stringify(err.$metadata));
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  if (err.$metadata) {
    const msg = err.$metadata.httpStatusCode === 403
      ? 'S3 access denied – check your credentials'
      : `S3 error (${err.$metadata.httpStatusCode}): ${err.name}`;
    return res.status(502).json({ error: msg });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
}
