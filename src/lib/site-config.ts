/** Préférences visuelles locales de l'interface publique. */

export type SiteConfig = { customCursorEnabled: boolean };

const STORAGE_KEY = "ae2v_site_config_v1";
export const defaultSiteConfig: SiteConfig = {
  customCursorEnabled: true,
};

export function getSiteConfig(): SiteConfig {
  if (typeof window === "undefined") return defaultSiteConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSiteConfig;
    const value = JSON.parse(raw) as Partial<SiteConfig>;
    return {
      customCursorEnabled:
        typeof value.customCursorEnabled === "boolean"
          ? value.customCursorEnabled
          : defaultSiteConfig.customCursorEnabled,
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
