/**
 * Generate a unique teacher code
 * Format: 6 alphanumeric characters (uppercase letters and numbers)
 */
export function generateTeacherCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate teacher code format
 */
export function isValidTeacherCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

