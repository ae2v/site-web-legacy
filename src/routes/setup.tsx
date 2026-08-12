import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { HardCard, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  getSiteConfig,
  saveSiteConfig,
  sendTestSmtpEmail,
  type SiteConfig,
  type SmtpTestResult,
} from "@/lib/site-config";
import { useDemoSession } from "@/lib/demo-session";

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
  const { can, sessionResolved } = useDemoSession();

  const [config, setConfig] = useState<SiteConfig>(getSiteConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [testEmailTarget, setTestEmailTarget] = useState("admin@ae2v.fr");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<SmtpTestResult | null>(null);

  useEffect(() => {
    setConfig(getSiteConfig());
  }, []);

  function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    const patch: Partial<SiteConfig> = { ...config };
    const updated = saveSiteConfig(patch);
    setConfig(updated);
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

  if (!sessionResolved) {
    return (
      <>
        <PageHero
          eyebrow="Administration"
          title="Vérification de session"
          intro="Vérification de tes droits Bureau en cours…"
        />
      </>
    );
  }

  if (!can("events:manage")) {
    return (
      <>
        <PageHero
          eyebrow="Administration"
          title="Accès Bureau requis"
          intro="La configuration système est réservée aux membres du Bureau autorisés."
        >
          <Button asChild size="lg">
            <Link to="/connexion">Se connecter</Link>
          </Button>
        </PageHero>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Administration Système"
        title="Centre de Configuration AE2V"
        intro="Gestion des paramètres d’interface. Les secrets et l’envoi d’e-mails restent côté serveur."
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
                  Autoriser les données de prévisualisation locales
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

          <HardCard eyebrow="SÉCURITÉ" title="Session Bureau active">
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                L’accès à cette page est contrôlé par la session serveur et les droits Bureau. Aucun
                mot de passe maître n’est stocké dans le navigateur.
              </p>
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

      <Section number={2} ghost="E-MAIL" title="Transport e-mail serveur" tone="dark">
        <div className="grid gap-6 md:grid-cols-2">
          <HardCard eyebrow="TRANSPORT SERVEUR" title="Référence du transport (sans secret)">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                  Serveur de transport (référence)
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
                  Identifiant du transport
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
                <p className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                  Secret du transport (non stocké dans le navigateur)
                </p>
                <p className="mt-1 border-2 border-ae2v-black/20 bg-ae2v-offwhite p-3 text-xs text-ae2v-black/75">
                  À configurer uniquement dans les variables d’environnement Vercel ou du serveur.
                </p>
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

              <p className="border-2 border-ae2v-red bg-ae2v-red/10 p-3 text-xs font-bold text-ae2v-black">
                Ces paramètres sont indicatifs pour la configuration locale. Aucun mot de passe
                n’est conservé dans le navigateur et aucun envoi ne part directement depuis cette
                page.
              </p>
              <Button onClick={handleSaveConfig} className="mt-4 w-full">
                <Save aria-hidden="true" />
                Enregistrer les paramètres locaux
              </Button>
            </div>
          </HardCard>

          <HardCard eyebrow="DIAGNOSTIC" title="Envoi serveur requis">
            <div className="space-y-4">
              <p className="text-sm text-ae2v-black/80">
                L’envoi réel utilise le transport serveur configuré dans Vercel : `RESEND_API_KEY`
                et `EMAIL_FROM`. Le navigateur ne reçoit jamais le secret.
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

              <Button onClick={handleTestSmtp} disabled variant="green" className="w-full">
                {testLoading ? (
                  <RefreshCw className="animate-spin" aria-hidden="true" />
                ) : (
                  <Mail aria-hidden="true" />
                )}
                {testLoading ? "Vérification en cours…" : "Test disponible côté serveur uniquement"}
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
