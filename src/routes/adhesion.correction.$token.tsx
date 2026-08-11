import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  getMembershipCorrectionServer,
  submitMembershipCorrectionServer,
  type MembershipCorrectionThread,
} from "@/lib/server-functions/membership";

export const Route = createFileRoute("/adhesion/correction/$token")({
  head: () => ({
    meta: [
      { title: "Corriger ma demande d’adhésion — AE2V" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MembershipCorrectionPage,
});

function MembershipCorrectionPage() {
  const { token } = Route.useParams();
  const loadThread = useServerFn(getMembershipCorrectionServer);
  const submitReply = useServerFn(submitMembershipCorrectionServer);
  const [thread, setThread] = useState<MembershipCorrectionThread | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadThread({ data: { token } })
      .then(setThread)
      .catch(() => setThread(null))
      .finally(() => setLoading(false));
  }, [loadThread, token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setError("");
    try {
      await submitReply({ data: { token, message: message.trim() } });
      setSubmitted(true);
      setMessage("");
      setThread(await loadThread({ data: { token } }));
    } catch {
      setError("La réponse n’a pas pu être envoyée. Le lien est peut-être expiré.");
    }
  }

  return (
    <main className="min-h-screen bg-ae2v-offwhite pb-20">
      <PageHero
        eyebrow="Adhésion AE2V / Correction"
        title="Compléter ma demande"
        intro="Répondez aux demandes du Bureau directement depuis cette page sécurisée. Aucun compte n’est nécessaire."
      />
      <Section
        title={
          loading ? "Chargement…" : thread ? `Bonjour ${thread.firstName}` : "Lien indisponible"
        }
      >
        {!loading && !thread ? (
          <p className="border-2 border-ae2v-red bg-card p-5 text-sm">
            Ce lien de correction est invalide ou n’est plus disponible.
          </p>
        ) : thread ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="border-2 border-ae2v-black bg-card p-5">
              <h2 className="font-impact text-2xl uppercase">Échanges précédents</h2>
              <div className="mt-4 space-y-3">
                {thread.messages.map((item) => (
                  <article
                    key={item.id}
                    className="border-2 border-ae2v-black/15 bg-ae2v-offwhite p-4"
                  >
                    <p className="text-xs font-bold uppercase text-ae2v-red">
                      {item.authorType === "BUREAU" ? "Bureau AE2V" : "Votre réponse"} ·{" "}
                      {item.authorName}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </article>
                ))}
              </div>
            </div>
            <form
              onSubmit={handleSubmit}
              className="border-2 border-ae2v-black bg-ae2v-black p-5 text-ae2v-offwhite"
            >
              <h2 className="font-impact text-2xl uppercase">Répondre au Bureau</h2>
              <p className="mt-2 text-sm text-ae2v-offwhite/75">
                Après votre réponse, le dossier repassera en attente d’examen.
              </p>
              <label className="mt-5 block text-xs font-bold uppercase">
                Votre réponse
                <textarea
                  required
                  minLength={2}
                  rows={8}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="mt-2 w-full border-2 border-ae2v-offwhite bg-ae2v-offwhite p-3 text-sm font-normal text-ae2v-black"
                  placeholder="Indiquez les informations corrigées…"
                />
              </label>
              {error && <p className="mt-3 text-sm text-ae2v-green">{error}</p>}
              {submitted && (
                <p className="mt-3 text-sm text-ae2v-green">Réponse envoyée au Bureau.</p>
              )}
              <Button className="mt-5" variant="default" type="submit">
                Envoyer ma réponse
              </Button>
            </form>
          </div>
        ) : null}
      </Section>
    </main>
  );
}
