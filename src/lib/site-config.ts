/** Configuration non sensible de l’interface, stockée localement pour la démo. */

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  secure: boolean;
  senderEmail: string;
  senderName: string;
};

export type SiteConfig = {
  siteName: string;
  schoolYear: string;
  demoModeEnabled: boolean;
  customCursorEnabled: boolean;
  smtp: SmtpConfig;
};

const STORAGE_KEY = "ae2v_site_config_v1";
export const defaultSiteConfig: SiteConfig = {
  siteName: "AE2V — BDE Vélizy",
  schoolYear: "2026-2027",
  demoModeEnabled: true,
  customCursorEnabled: true,
  smtp: {
    host: "smtp.ae2v.fr",
    port: 587,
    user: "contact@ae2v.fr",
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
    const value = JSON.parse(raw) as Partial<SiteConfig>;
    return {
      siteName: typeof value.siteName === "string" ? value.siteName : defaultSiteConfig.siteName,
      schoolYear:
        typeof value.schoolYear === "string" ? value.schoolYear : defaultSiteConfig.schoolYear,
      demoModeEnabled:
        typeof value.demoModeEnabled === "boolean"
          ? value.demoModeEnabled
          : defaultSiteConfig.demoModeEnabled,
      customCursorEnabled:
        typeof value.customCursorEnabled === "boolean"
          ? value.customCursorEnabled
          : defaultSiteConfig.customCursorEnabled,
      smtp: {
        host: typeof value.smtp?.host === "string" ? value.smtp.host : defaultSiteConfig.smtp.host,
        port: typeof value.smtp?.port === "number" ? value.smtp.port : defaultSiteConfig.smtp.port,
        user: typeof value.smtp?.user === "string" ? value.smtp.user : defaultSiteConfig.smtp.user,
        secure:
          typeof value.smtp?.secure === "boolean"
            ? value.smtp.secure
            : defaultSiteConfig.smtp.secure,
        senderEmail:
          typeof value.smtp?.senderEmail === "string"
            ? value.smtp.senderEmail
            : defaultSiteConfig.smtp.senderEmail,
        senderName:
          typeof value.smtp?.senderName === "string"
            ? value.smtp.senderName
            : defaultSiteConfig.smtp.senderName,
      },
    };
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

export type SmtpTestResult = {
  success: boolean;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
};

export async function sendTestSmtpEmail(targetEmail: string): Promise<SmtpTestResult> {
  const timestamp = new Date().toLocaleTimeString("fr-FR");
  return {
    success: false,
    message: `Aucun envoi SMTP n’est effectué depuis le navigateur. Configurez le transport côté serveur avant de tester ${targetEmail}.`,
    timestamp,
  };
}
