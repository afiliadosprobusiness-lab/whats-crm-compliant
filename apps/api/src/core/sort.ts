const toDateMs = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const timestamp = new Date(normalized).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const normalizeText = (value: unknown): string => String(value ?? "").trim().toLowerCase();

export const compareIsoDateAsc = (left: unknown, right: unknown): number => {
  const leftMs = toDateMs(left);
  const rightMs = toDateMs(right);

  if (leftMs !== null && rightMs !== null) {
    return leftMs - rightMs;
  }

  if (leftMs !== null) {
    return -1;
  }

  if (rightMs !== null) {
    return 1;
  }

  return normalizeText(left).localeCompare(normalizeText(right));
};

export const compareIsoDateDesc = (left: unknown, right: unknown): number => {
  const leftMs = toDateMs(left);
  const rightMs = toDateMs(right);

  if (leftMs !== null && rightMs !== null) {
    return rightMs - leftMs;
  }

  if (leftMs !== null) {
    return -1;
  }

  if (rightMs !== null) {
    return 1;
  }

  return normalizeText(right).localeCompare(normalizeText(left));
};

export const compareTextAsc = (left: unknown, right: unknown): number => {
  return normalizeText(left).localeCompare(normalizeText(right));
};
