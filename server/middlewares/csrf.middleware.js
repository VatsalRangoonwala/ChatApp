import AppError from "../utils/appError.js";

/**
 * Simple CSRF protection middleware.
 * Checks for a custom header that browsers don't send automatically.
 * This is effective for SPAs where all requests are made via JS (fetch/axios).
 */
export const csrfProtect = (req, res, next) => {
  // Skip GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const csrfHeader = req.headers["x-requested-with"];

  if (!csrfHeader) {
    return next(new AppError("CSRF protection: Missing required header", 403));
  }

  next();
};
