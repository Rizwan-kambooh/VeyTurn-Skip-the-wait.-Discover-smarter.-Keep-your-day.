export const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

export const phoneDigits = (value: string) => value.replace(/\D/g, '');
export const isValidPhone = (value: string) => {
  const digits = phoneDigits(value);
  return digits.length >= 10 && digits.length <= 15;
};

export const isValidLoginIdentifier = (value: string) =>
  isValidEmail(value) || isValidPhone(value);

export const passwordRules = [
  {id: 'length', label: 'At least 8 characters', test: (value: string) => value.length >= 8},
  {id: 'letters', label: 'Uppercase and lowercase letters', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value)},
  {id: 'number', label: 'At least one number', test: (value: string) => /\d/.test(value)},
  {id: 'special', label: 'At least one special character', test: (value: string) => /[^A-Za-z0-9]/.test(value)},
] as const;

export const isStrongPassword = (value: string) => passwordRules.every(rule => rule.test(value));
