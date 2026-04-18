export const isValidEmail = (email = "") => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const normalizeEmail = (email = "") => {
  return email.trim().toLowerCase();
};

export const trimString = (value = "") => {
  return value.trim();
};
