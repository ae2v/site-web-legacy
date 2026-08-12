import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { unsubscribeEmailServer } from "@/lib/server-functions/email-preferences";

export const Route = createFileRoute("/email/desinscription/$token")({
  validateSearch: z.object({
    category: z
      .enum(["ADHESION", "EVENEMENTS", "BOUTIQUE", "BDE", "INFORMATIONS_GENERALES"])
      .optional(),
  }),
  head: () => ({
    meta: [
      { title: "Gérer mes communications — AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useParams();
  const search = Route.useSearch();
  const unsubscribe = useServerFn(unsubscribeEmailServer);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submitUnsubscribe() {
    setState("loading");
    try {
      await unsubscribe({ data: { token, category: search.category } });
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Préférences email"
        title="Gérer mes communications"
        intro="Tu peux arrêter une catégorie ou toutes les communications facultatives à tout moment. Les messages liés à une action demandée ou à un paiement restent séparés."
      />
      <Section title={state === "done" ? "Désinscription confirmée" : "Désinscription"}>
        {state === "done" ? (
          <div className="border-2 border-ae2v-black bg-ae2v-green p-6">
            <p className="font-bold">
              {search.category
                ? "Cette catégorie facultative a été désactivée."
                : "Toutes les catégories facultatives ont été désactivées."}
            </p>
            <p className="mt-2 text-sm">Tu peux les réactiver depuis ton espace personnel.</p>
            <Button asChild className="mt-5" variant="black">
              <Link to="/espace">Ouvrir mon espace</Link>
            </Button>
          </div>
        ) : (
          <div className="max-w-xl border-2 border-ae2v-black bg-card p-6">
            <p className="text-sm">
              {search.category
                ? `Confirme la désactivation de la catégorie « ${search.category} » envoyée par AE2V.`
                : "Confirme la désactivation de toutes les communications facultatives envoyées par AE2V."}
            </p>
            {state === "error" && (
              <p role="alert" className="mt-4 border-2 border-ae2v-red bg-ae2v-red/10 p-3 text-sm">
                Ce lien est invalide ou expiré.
              </p>
            )}
            <Button
              className="mt-6"
              variant="black"
              disabled={state === "loading"}
              onClick={() => void submitUnsubscribe()}
            >
              {state === "loading"
                ? "Enregistrement…"
                : search.category
                  ? "Désactiver cette catégorie"
                  : "Désactiver toutes les communications"}
            </Button>
          </div>
        )}
      </Section>
    </>
  );
}
