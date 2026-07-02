export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File exceeds 25MB limit" });
  }

  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message ?? "Internal server error",
  });
}
