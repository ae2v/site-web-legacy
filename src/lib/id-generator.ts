/**
 * Générateur d'identifiants et de QR Codes imprévisibles pour l'AE2V (comprenant toujours '2026').
 */

export function generateRandom2026Code(prefix: "TK" | "USR" | "FAC" | "CMD"): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans ambiguïté (pas de O, 0, I, 1)
  let randomPart = "";
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AE2V-2026-${prefix}-${randomPart}`;
}
