export function createOpaqueToken(prefix: string, bytes = 5): string {
  const values = globalThis.crypto.getRandomValues(new Uint8Array(bytes));
  const suffix = Array.from(values, (value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${prefix}${suffix}`;
}
