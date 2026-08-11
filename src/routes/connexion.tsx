import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogIn } from "lucide-react";

import { TapeLabel } from "@/components/brand";
import { PageHero } from "@/components/layout/page-hero";
import { HardCard, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  contributionStatusLabels,
  demoAccounts,
  membershipStatusLabels,
  roleLabels,
  useDemoSession,
} from "@/lib/demo-session";
import type { RemoteAccount } from "@/lib/demo-session";
import { signInServer, signOutServer, signUpServer } from "@/lib/server-functions/auth";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion démo — AE2V" },
      {
        name: "description",
        content:
          "Page de connexion de démonstration AE2V : tester les parcours membre cotisant, non cotisant et bureau.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Connexion démo — AE2V" },
      { property: "og:description", content: "Connexion de démonstration AE2V." },
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
  const { account, signIn, signInRemote, signInWithCredentials, signOut, signUp } = session;
  const remoteSignIn = useServerFn(signInServer);
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

  function quickLogin(id: string) {
    signIn(id);
    void navigate({ to: "/espace" });
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
          result = signInWithCredentials(email, password);
        }
      } catch {
        result = signInWithCredentials(email, password);
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
        const res = signUp({ email, password, firstName, lastName, departement, niveau });
        if (!res.ok) {
          setError(res.error ?? "Erreur lors de l'inscription.");
          return;
        }
        setError(null);
        void navigate({ to: "/espace" });
      }
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Espace membre"
        title="Connexion & Inscription"
        intro="Connecte-toi à ton compte étudiant AE2V ou utilise l'un des profils de démonstration préconfigurés."
      />

      <Section
        number={1}
        ghost="PROFILS"
        title="Comptes de démonstration rapide"
        intro="Choisis un profil préconfiguré pour tester les parcours (étudiant, cotisant, bureau)."
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

        <div className="grid gap-4 md:grid-cols-2">
          {demoAccounts.map((demo) => (
            <HardCard
              key={demo.id}
              eyebrow={`${roleLabels[demo.role]} · ${contributionStatusLabels[demo.contributionStatus]}`}
              title={`${demo.firstName} ${demo.lastName}`}
              tone={demo.role === "bureau_admin" ? "green" : "light"}
            >
              <ul className="space-y-1">
                <li>
                  <strong>Formation :</strong> {demo.departement} · {demo.niveau}
                </li>
                <li>
                  <strong>Adhésion :</strong> {membershipStatusLabels[demo.membershipStatus]}
                </li>
                <li>
                  <strong>Cotisation :</strong> {contributionStatusLabels[demo.contributionStatus]}
                  {demo.contributionCents > 0
                    ? ` · ${(demo.contributionCents / 100).toFixed(2)} €`
                    : ""}
                </li>
                <li>
                  <strong>Droits :</strong>{" "}
                  {demo.role === "bureau_admin"
                    ? "consulter, corriger et valider les dossiers"
                    : demo.role === "bureau"
                      ? "consulter et corriger, sans validation"
                      : "espace étudiant uniquement"}
                </li>
                <li className="pt-1 text-xs opacity-70">{demo.email} · mot de passe : demo1234</li>
              </ul>
              <Button className="mt-4 w-full" onClick={() => quickLogin(demo.id)}>
                <LogIn aria-hidden="true" />
                Se connecter comme {demo.firstName}
              </Button>
            </HardCard>
          ))}
        </div>
      </Section>

      <Section
        number={2}
        ghost="COMPTE"
        title={mode === "login" ? "Connexion à votre compte" : "Créer un compte étudiant"}
        tone="dark"
        intro="Créez votre compte personnel ou connectez-vous avec vos identifiants."
      >
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
      </Section>
    </>
  );
}
