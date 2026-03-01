import { timingSafeEqual } from "node:crypto";

export const secureCompare = (provided: string, expected: string): boolean => {
  const left = Buffer.from(String(provided || ""), "utf8");
  const right = Buffer.from(String(expected || ""), "utf8");
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
};
