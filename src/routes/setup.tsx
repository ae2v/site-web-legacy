import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  Mail,
  Save,
  RefreshCw,
  Key,
  Server,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { TapeLabel } from "@/components/brand";
import { PageHero } from "@/components/layout/page-hero";
import { HardCard, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  getSiteConfig,
  saveSiteConfig,
  verifyMasterPassword,
  sendTestSmtpEmail,
  type SiteConfig,
  type SmtpTestResult,
} from "@/lib/site-config";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Configuration système — AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SetupPage,
});

const inputClass =
  "min-h-[44px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-base text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

function SetupPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const [config, setConfig] = useState<SiteConfig>(getSiteConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [newMasterPassword, setNewMasterPassword] = useState("");

  const [testEmailTarget, setTestEmailTarget] = useState("admin@ae2v.fr");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<SmtpTestResult | null>(null);

  useEffect(() => {
    setConfig(getSiteConfig());
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (verifyMasterPassword(passwordInput)) {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError("Mot de passe maître incorrect. (Par défaut : ae2v-admin-2026)");
    }
  }

  function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    const patch: Partial<SiteConfig> = { ...config };
    if (newMasterPassword.trim().length > 0) {
      patch.masterPasswordHash = newMasterPassword.trim();
    }
    const updated = saveSiteConfig(patch);
    setConfig(updated);
    setNewMasterPassword("");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  async function handleTestSmtp() {
    if (!testEmailTarget) return;
    setTestLoading(true);
    setTestResult(null);
    const res = await sendTestSmtpEmail(testEmailTarget);
    setTestResult(res);
    setTestLoading(false);
  }

  if (!isAuthenticated) {
    return (
      <>
        <PageHero
          eyebrow="Administration"
          title="Configuration Système"
          intro="Accès restreint. Veuillez saisir le mot de passe maître pour accéder aux paramètres du site et au serveur SMTP."
        />

        <Section number={1} ghost="ACCÈS" title="Authentification Maître" tone="dark">
          <form
            onSubmit={handleLogin}
            className="mx-auto max-w-md border-2 border-ae2v-black bg-ae2v-offwhite p-6"
          >
            <TapeLabel tone="red">Zone Sécurisée</TapeLabel>
            <p className="mt-4 text-sm text-ae2v-black/70">
              Entrez le mot de passe maître de l'application temporaire.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                Mot de passe maître
              </label>
              <input
                type="password"
                className={`${inputClass} mt-2`}
                placeholder="ae2v-admin-2026"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
              />
            </div>

            {authError ? (
              <p role="alert" className="mt-4 text-sm font-bold text-ae2v-red">
                ✕ {authError}
              </p>
            ) : null}

            <Button type="submit" className="mt-6 w-full" size="lg">
              <Key aria-hidden="true" />
              Déverrouiller la configuration
            </Button>
          </form>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Administration Système"
        title="Centre de Configuration AE2V"
        intro="Gestion des paramètres globaux, mot de passe maître et configuration des envois SMTP."
      />

      <Section number={1} ghost="GENERAL" title="Paramètres Généraux & Sécurité" tone="light">
        <form onSubmit={handleSaveConfig} className="grid gap-6 md:grid-cols-2">
          <HardCard eyebrow="GÉNÉRAL" title="Identité & bascules">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-[0.14em] uppercase">
                  Nom du site
                </label>
                <input
                  type="text"
                  className={`${inputClass} mt-1`}
                  value={config.siteName}
                  onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.14em] uppercase">
                  Année universitaire
                </label>
                <input
                  type="text"
                  className={`${inputClass} mt-1`}
                  value={config.schoolYear}
                  onChange={(e) => setConfig({ ...config, schoolYear: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="toggle-demo"
                  type="checkbox"
                  className="h-5 w-5 accent-ae2v-red"
                  checked={config.demoModeEnabled}
                  onChange={(e) => setConfig({ ...config, demoModeEnabled: e.target.checked })}
                />
                <label htmlFor="toggle-demo" className="text-sm font-bold">
                  Activer le mode comptes de démonstration rapide
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="toggle-cursor"
                  type="checkbox"
                  className="h-5 w-5 accent-ae2v-red"
                  checked={config.customCursorEnabled}
                  onChange={(e) => setConfig({ ...config, customCursorEnabled: e.target.checked })}
                />
                <label htmlFor="toggle-cursor" className="text-sm font-bold">
                  Activer le curseur personnalisé AE2V
                </label>
              </div>
            </div>
          </HardCard>

          <HardCard eyebrow="SÉCURITÉ" title="Changer le Mot de Passe Maître">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Ce mot de passe contrôle l'accès à cette page <code>/setup</code>.
              </p>
              <div>
                <label className="block text-xs font-bold tracking-[0.14em] uppercase">
                  Nouveau mot de passe maître
                </label>
                <input
                  type="password"
                  className={`${inputClass} mt-1`}
                  placeholder="Laisser vide pour ne pas changer"
                  value={newMasterPassword}
                  onChange={(e) => setNewMasterPassword(e.target.value)}
                />
              </div>
              <div className="pt-4">
                <Button type="submit" variant="red" className="w-full">
                  <Save aria-hidden="true" />
                  Sauvegarder les paramètres
                </Button>
                {saveSuccess ? (
                  <p className="mt-2 text-center text-xs font-bold text-emerald-600">
                    ✓ Modifications enregistrées avec succès !
                  </p>
                ) : null}
              </div>
            </div>
          </HardCard>
        </form>
      </Section>

      <Section number={2} ghost="SMTP" title="Configuration & Test SMTP" tone="dark">
        <div className="grid gap-6 md:grid-cols-2">
          <HardCard eyebrow="SMTP" title="Paramètres du Serveur E-mail">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                  Serveur SMTP (Host)
                </label>
                <input
                  type="text"
                  className={`${inputClass} mt-1`}
                  value={config.smtp.host}
                  onChange={(e) =>
                    setConfig({ ...config, smtp: { ...config.smtp, host: e.target.value } })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                    Port
                  </label>
                  <input
                    type="number"
                    className={`${inputClass} mt-1`}
                    value={config.smtp.port}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        smtp: { ...config.smtp, port: parseInt(e.target.value) || 587 },
                      })
                    }
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-ae2v-red"
                      checked={config.smtp.secure}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          smtp: { ...config.smtp, secure: e.target.checked },
                        })
                      }
                    />
                    SSL/TLS
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                  Utilisateur SMTP
                </label>
                <input
                  type="text"
                  className={`${inputClass} mt-1`}
                  value={config.smtp.user}
                  onChange={(e) =>
                    setConfig({ ...config, smtp: { ...config.smtp, user: e.target.value } })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                  Mot de passe SMTP
                </label>
                <input
                  type="password"
                  className={`${inputClass} mt-1`}
                  value={config.smtp.pass}
                  onChange={(e) =>
                    setConfig({ ...config, smtp: { ...config.smtp, pass: e.target.value } })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                    E-mail Expéditeur
                  </label>
                  <input
                    type="email"
                    className={`${inputClass} mt-1`}
                    value={config.smtp.senderEmail}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        smtp: { ...config.smtp, senderEmail: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                    Nom Expéditeur
                  </label>
                  <input
                    type="text"
                    className={`${inputClass} mt-1`}
                    value={config.smtp.senderName}
                    onChange={(e) =>
                      setConfig({ ...config, smtp: { ...config.smtp, senderName: e.target.value } })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSaveConfig} className="mt-4 w-full">
                <Save aria-hidden="true" />
                Enregistrer la configuration SMTP
              </Button>
            </div>
          </HardCard>

          <HardCard eyebrow="DIAGNOSTIC" title="Test d'Envoi SMTP">
            <div className="space-y-4">
              <p className="text-sm text-ae2v-black/80">
                Envoyez un e-mail de test pour valider la communication avec votre serveur SMTP.
              </p>

              <div>
                <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                  Adresse e-mail destinataire de test
                </label>
                <input
                  type="email"
                  className={`${inputClass} mt-1`}
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                />
              </div>

              <Button
                onClick={handleTestSmtp}
                disabled={testLoading}
                variant="green"
                className="w-full"
              >
                {testLoading ? (
                  <RefreshCw className="animate-spin" aria-hidden="true" />
                ) : (
                  <Mail aria-hidden="true" />
                )}
                {testLoading ? "Envoi du test en cours..." : "Tester la connexion SMTP"}
              </Button>

              {testResult ? (
                <div
                  className={`border-2 p-4 ${
                    testResult.success
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                      : "border-ae2v-red bg-red-50 text-red-950"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.success ? (
                      <CheckCircle2 className="text-emerald-600" />
                    ) : (
                      <AlertCircle className="text-ae2v-red" />
                    )}
                    <span>{testResult.success ? "Test Réussi" : "Échec du Test"}</span>
                    <span className="ml-auto text-xs opacity-75">{testResult.timestamp}</span>
                  </div>
                  <p className="mt-2 text-sm">{testResult.message}</p>

                  {testResult.details ? (
                    <pre className="mt-3 overflow-x-auto rounded bg-black/10 p-2 text-xs font-mono">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ) : null}
            </div>
          </HardCard>
        </div>
      </Section>
    </>
  );
}
