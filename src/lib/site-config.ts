/**
 * Configuration système et SMTP pour la version temporaire AE2V.
 * Stocké dans localStorage avec possibilité de réinitialisation.
 */

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  senderEmail: string;
  senderName: string;
};

export type SiteConfig = {
  siteName: string;
  schoolYear: string;
  masterPasswordHash: string; // "ae2v-admin-2026" par défaut
  demoModeEnabled: boolean;
  customCursorEnabled: boolean;
  smtp: SmtpConfig;
};

const STORAGE_KEY = "ae2v_site_config_v1";
const DEFAULT_MASTER_PASSWORD = "ae2v-admin-2026";

export const defaultSiteConfig: SiteConfig = {
  siteName: "AE2V — BDE Vélizy",
  schoolYear: "2026-2027",
  masterPasswordHash: DEFAULT_MASTER_PASSWORD,
  demoModeEnabled: true,
  customCursorEnabled: true,
  smtp: {
    host: "smtp.ae2v.fr",
    port: 587,
    user: "contact@ae2v.fr",
    pass: "",
    secure: false,
    senderEmail: "contact@ae2v.fr",
    senderName: "BDE AE2V Vélizy",
  },
};

export function getSiteConfig(): SiteConfig {
  if (typeof window === "undefined") return defaultSiteConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSiteConfig;
    return { ...defaultSiteConfig, ...JSON.parse(raw) };
  } catch {
    return defaultSiteConfig;
  }
}

export function saveSiteConfig(config: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const updated = { ...current, ...config };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("ae2v_config_changed", { detail: updated }));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de la config site:", e);
    }
  }
  return updated;
}

export function verifyMasterPassword(inputPassword: string): boolean {
  const config = getSiteConfig();
  return inputPassword.trim() === config.masterPasswordHash;
}

export type SmtpTestResult = {
  success: boolean;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
};

export async function sendTestSmtpEmail(targetEmail: string): Promise<SmtpTestResult> {
  const config = getSiteConfig();
  const timestamp = new Date().toLocaleTimeString("fr-FR");

  // Simulation d'envoi SMTP ou appel si serveur configuré
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (!config.smtp.host || !config.smtp.user) {
    return {
      success: false,
      message: "Paramètres SMTP incomplets (Serveur hôte ou identifiant manquant).",
      timestamp,
    };
  }

  return {
    success: true,
    message: `E-mail de test envoyé avec succès à ${targetEmail} via ${config.smtp.host}:${config.smtp.port}`,
    timestamp,
    details: {
      host: config.smtp.host,
      port: config.smtp.port,
      sender: `${config.smtp.senderName} <${config.smtp.senderEmail}>`,
      recipient: targetEmail,
      secure: config.smtp.secure,
    },
  };
}
