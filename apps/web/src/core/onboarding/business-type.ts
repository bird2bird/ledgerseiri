export type BusinessType = "amazon" | "ec" | "restaurant" | "generic";

export const BUSINESS_TYPE_STORAGE_KEY = "ls_business_type";

export function isBusinessType(value: unknown): value is BusinessType {
  return (
    value === "amazon" ||
    value === "ec" ||
    value === "restaurant" ||
    value === "generic"
  );
}

export function readBusinessTypeFromStorage(): BusinessType | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BUSINESS_TYPE_STORAGE_KEY);
    return isBusinessType(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeBusinessTypeToStorage(value: BusinessType): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BUSINESS_TYPE_STORAGE_KEY, value);
  } catch {
    // no-op
  }
}

export function clearBusinessTypeFromStorage(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(BUSINESS_TYPE_STORAGE_KEY);
  } catch {
    // no-op
  }
}
