import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const hashPassword = (plainPassword: string): { salt: string; hash: string } => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plainPassword, salt, 64).toString("hex");
  return { salt, hash };
};

export const verifyPassword = (plainPassword: string, salt: string, hash: string): boolean => {
  const calculated = scryptSync(plainPassword, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (calculated.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(calculated, expected);
};

