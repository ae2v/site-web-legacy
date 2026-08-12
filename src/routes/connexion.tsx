import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { TapeLabel } from "@/components/brand";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { roleLabels, useDemoSession } from "@/lib/demo-session";
import type { RemoteAccount } from "@/lib/demo-session";
import {
  getCurrentUserServer,
  quickSignInServer,
  signInServer,
  signOutServer,
  signUpServer,
} from "@/lib/server-functions/auth";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — AE2V" },
      {
        name: "description",
        content: "Page de connexion AE2V pour les adhérents et les membres du bureau.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Connexion — AE2V" },
      { property: "og:description", content: "Connexion AE2V pour les adhérents et le bureau." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ConnexionPage,
});

const inputClass =
  "min-h-[44px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-base text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

function ConnexionPage() {
  const navigate = useNavigate();
  const session = useDemoSession();
  const { account, signInRemote, signOut } = session;
  const remoteSignIn = useServerFn(signInServer);
  const remoteQuickSignIn = useServerFn(quickSignInServer);
  const remoteCurrentUser = useServerFn(getCurrentUserServer);
  const remoteSignOut = useServerFn(signOutServer);
  const remoteSignUp = useServerFn(signUpServer);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [departement, setDepartement] = useState("Informatique");
  const [niveau, setNiveau] = useState("1re année");
  const [error, setError] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  async function onQuickSignIn(key: "president" | "bureau" | "cotisant" | "non-cotisant") {
    setQuickLoading(key);
    setError(null);
    try {
      const result = await remoteQuickSignIn({ data: { key } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const current = await remoteCurrentUser();
      if (!current.ok) {
        setError("Connexion rapide indisponible. Réessaie dans un instant.");
        return;
      }
      signInRemote(current.user);
      void navigate({ to: "/espace" });
    } catch {
      setError("Connexion rapide indisponible. Réessaie dans un instant.");
    } finally {
      setQuickLoading(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      let result: { ok: boolean; error?: string };
      let remoteUser: RemoteAccount | null = null;
      try {
        const remote = await remoteSignIn({ data: { email, password } });
        if (remote.ok) {
          remoteUser = remote.user;
          result = { ok: true };
        } else {
          result = { ok: false, error: "Connexion indisponible. Réessaie dans un instant." };
        }
      } catch {
        result = { ok: false, error: "Connexion indisponible. Réessaie dans un instant." };
      }
      if (result.ok) {
        if (remoteUser) signInRemote(remoteUser);
      }
      if (!result.ok) {
        setError(result.error ?? "Connexion impossible.");
        return;
      }
      setError(null);
      void navigate({ to: "/espace" });
    } else {
      if (!email || !password || !firstName || !lastName) {
        setError("Veuillez remplir tous les champs obligatoires.");
        return;
      }
      try {
        const remote = await remoteSignUp({
          data: { email, password, firstName, lastName, departement, niveau },
        });
        if (!remote.ok) {
          setError(remote.error);
          return;
        }
        signInRemote(remote.user);
        setError(null);
        void navigate({ to: "/espace" });
        return;
      } catch {
        setError("Inscription indisponible. Réessaie dans un instant.");
      }
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Espace membre"
        title="Connexion & Inscription"
        intro="Connecte-toi à ton compte adhérent ou membre du bureau AE2V."
      />

      <Section
        ghost="ACCÈS"
        title="Accès à ton compte"
        tone="dark"
        intro="Connecte-toi directement à ton espace AE2V."
      >
        {account ? (
          <div className="mb-8 border-2 border-ae2v-black bg-ae2v-green p-5 text-ae2v-black">
            <p className="text-sm font-bold">
              Connecté en tant que {account.firstName} {account.lastName} ·{" "}
              {roleLabels[account.role]}.
            </p>
            <Button
              className="mt-4"
              variant="black"
              onClick={() => {
                signOut();
                void remoteSignOut().catch(() => undefined);
              }}
            >
              Se déconnecter
            </Button>
          </div>
        ) : null}

        <div className="mb-6 flex gap-2">
          <Button
            variant={mode === "login" ? "red" : "outline"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Se connecter
          </Button>
          <Button
            variant={mode === "register" ? "red" : "outline"}
            onClick={() => {
              setMode("register");
              setError(null);
            }}
          >
            Créer un compte
          </Button>
        </div>

        <form
          noValidate
          onSubmit={onSubmit}
          className="max-w-md border-2 border-ae2v-black bg-ae2v-offwhite p-6"
        >
          <TapeLabel tone="green">{mode === "login" ? "Accès membre" : "Nouveau compte"}</TapeLabel>

          {mode === "register" ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                    Prénom
                  </label>
                  <input
                    type="text"
                    className={`${inputClass} mt-1`}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                    Nom
                  </label>
                  <input
                    type="text"
                    className={`${inputClass} mt-1`}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                    Département
                  </label>
                  <select
                    className={`${inputClass} mt-1`}
                    value={departement}
                    onChange={(e) => setDepartement(e.target.value)}
                  >
                    <option value="Informatique">Informatique</option>
                    <option value="MMI">MMI</option>
                    <option value="GEII">GEII</option>
                    <option value="GMP">GMP</option>
                    <option value="RT">RT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase">
                    Niveau
                  </label>
                  <select
                    className={`${inputClass} mt-1`}
                    value={niveau}
                    onChange={(e) => setNiveau(e.target.value)}
                  >
                    <option value="1re année">1re année</option>
                    <option value="2e année">2e année</option>
                    <option value="3e année">3e année</option>
                  </select>
                </div>
              </div>
            </>
          ) : null}

          <div className="mt-4">
            <label
              htmlFor="login-email"
              className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase"
            >
              Adresse e-mail
            </label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              className={`${inputClass} mt-2`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="login-password"
              className="block text-xs font-bold tracking-[0.14em] text-ae2v-black uppercase"
            >
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={`${inputClass} mt-2`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p role="alert" className="mt-4 text-sm font-bold text-ae2v-red">
              <span aria-hidden="true">✕ </span>
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-6 w-full" size="lg">
            {mode === "login" ? "Se connecter" : "S'inscrire"}
          </Button>
        </form>

        {mode === "login" ? (
          <div className="mt-8 max-w-md border-2 border-ae2v-black/70 bg-ae2v-black/10 p-5 text-ae2v-offwhite">
            <TapeLabel tone="red">Accès rapides</TapeLabel>
            <p className="mt-4 text-sm text-ae2v-offwhite/80">
              Ouvre un compte réel de la base pour tester rapidement les différents espaces.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                ["president", "Président", "Compte bureau dirigeant"],
                ["bureau", "Membre du bureau", "Compte bureau"],
                ["cotisant", "Adhérent cotisant", "Compte adhérent"],
                ["non-cotisant", "Adhérent non cotisant", "Compte adhérent"],
              ].map(([key, label, description]) => (
                <button
                  key={key}
                  type="button"
                  disabled={quickLoading !== null}
                  onClick={() =>
                    onQuickSignIn(key as "president" | "bureau" | "cotisant" | "non-cotisant")
                  }
                  className="border border-ae2v-offwhite/40 bg-ae2v-black px-3 py-3 text-left transition hover:border-ae2v-red disabled:cursor-wait disabled:opacity-60"
                >
                  <span className="block text-sm font-bold">
                    {quickLoading === key ? "Connexion…" : label}
                  </span>
                  <span className="mt-1 block text-xs text-ae2v-offwhite/65">{description}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
