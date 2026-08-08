import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHero } from "@/components/layout/page-hero";
import { EmptyState, HardCard, Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { getDynamicNews, type Ae2vNewsArticle } from "@/lib/dynamic-store";

export const Route = createFileRoute("/actualites")({
  head: () => ({
    meta: [
      { title: "Actualités — AE2V" },
      {
        name: "description",
        content:
          "Annonces, comptes rendus et informations du bureau de l'AE2V, association étudiante de l'IUT de Vélizy.",
      },
      { property: "og:title", content: "Actualités — AE2V" },
      { property: "og:description", content: "Les annonces et informations du bureau AE2V." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/actualites" },
    ],
    links: [{ rel: "canonical", href: "/actualites" }],
  }),
  component: ActualitesPage,
});

function ActualitesPage() {
  const [articles, setArticles] = useState<Ae2vNewsArticle[]>(getDynamicNews());

  useEffect(() => {
    const handler = () => setArticles(getDynamicNews());
    window.addEventListener("ae2v_news_changed", handler);
    return () => window.removeEventListener("ae2v_news_changed", handler);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Le fil AE2V"
        title="Actualités"
        intro="Annonces du bureau, retours d'événements et informations pratiques pour la promo."
      />

      <Section number={1} ghost="NEWS" title="Dernières publications">
        {articles.length === 0 ? (
          <EmptyState
            label="Aucune actualité publiée"
            detail="Le bureau n'a pas encore publié d'article. En attendant, les annonces du jour passent surtout par Instagram et par les affichages du campus."
            action={
              <Button asChild size="lg" variant="secondary">
                <Link to="/contact">Contacter le bureau</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {articles.map((article) => (
              <article
                key={article.id}
                className="flex flex-col border-2 border-ae2v-black bg-card p-6"
              >
                <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="text-ae2v-red font-display">{article.category}</span>
                  <span>{article.date}</span>
                </div>
                <h2 className="mt-3 font-impact text-2xl uppercase leading-tight text-ae2v-black">
                  {article.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {article.summary}
                </p>
                <div className="mt-4 border-l-2 border-ae2v-red bg-ae2v-offwhite p-3 text-xs leading-relaxed text-ae2v-black">
                  {article.content}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ae2v-black/10 pt-3 text-xs text-muted-foreground">
                  <span>Publié par {article.author}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section number={2} ghost="SUIVRE" title="Où nous suivre" tone="dark">
        <div className="grid gap-4 md:grid-cols-3">
          <HardCard eyebrow="Événements" title="La programmation" tone="dark">
            Toutes les dates et la billetterie sont sur la page{" "}
            <Link className="ae2v-link font-bold text-ae2v-green" to="/evenements">
              événements
            </Link>
            .
          </HardCard>
          <HardCard eyebrow="Contact" title="Écrire au bureau" tone="dark">
            Une question, un projet, un partenariat : la page{" "}
            <Link className="ae2v-link font-bold text-ae2v-green" to="/contact">
              contact
            </Link>{" "}
            regroupe les bons interlocuteurs.
          </HardCard>
          <HardCard eyebrow="Association" title="Qui fait quoi" tone="dark">
            Les pôles et les membres du bureau sont présentés sur la page{" "}
            <Link className="ae2v-link font-bold text-ae2v-green" to="/bde">
              le BDE
            </Link>
            .
          </HardCard>
        </div>
      </Section>
    </>
  );
}
