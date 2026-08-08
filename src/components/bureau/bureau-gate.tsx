import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { useDemoSession } from "@/lib/demo-session";

/**
 * Garde d'accès du back-office (DÉMONSTRATION côté navigateur uniquement).
 * L'accès réel sera contrôlé côté serveur : auth → autorisation → audit.
 */
export function BureauGate({ children }: { children: ReactNode }) {
  const { account, isBureau } = useDemoSession();

  if (!account || !isBureau) {
    return (
      <>
        <PageHero
          eyebrow="Accès réservé"
          title="Bureau"
          intro="Gestion des adhérents, des événements et de la boutique. L'accès sera contrôlé côté serveur par rôle."
        />
        <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="flex items-start gap-3 border-2 border-ae2v-black bg-ae2v-black p-5 text-ae2v-offwhite">
            <Lock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ae2v-green" />
            <p className="text-sm">
              Cette section est réservée aux membres du bureau. En démonstration, connecte-toi avec
              un compte bureau pour visualiser les dossiers d'adhésion et les candidatures.
            </p>
          </div>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link to="/connexion">Choisir un compte de démonstration</Link>
            </Button>
          </div>
        </section>
      </>
    );
  }

  return <>{children}</>;
}
