export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidIdentifier = (identifier: string): boolean => {
  // Acepta email o número de identificación (solo números)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const idNumberRegex = /^\d+$/;
  return emailRegex.test(identifier) || idNumberRegex.test(identifier);
};