import AppError from "../utils/appError.js";

const stores = new Map();

const getStore = (key) => {
  if (!stores.has(key)) {
    stores.set(key, new Map());
  }

  return stores.get(key);
};

export const createRateLimiter = ({
  key = "default",
  windowMs,
  max,
  message,
}) => {
  const store = getStore(key);

  return (req, res, next) => {
    const now = Date.now();
    const identifier = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const entry = store.get(identifier);

    if (!entry || entry.expiresAt <= now) {
      store.set(identifier, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    if (entry.count >= max) {
      return next(new AppError(message, 429));
    }

    entry.count += 1;
    store.set(identifier, entry);
    return next();
  };
};
