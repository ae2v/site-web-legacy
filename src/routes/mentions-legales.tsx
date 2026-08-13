import { createFileRoute } from "@tanstack/react-router";

import { LegalBlock, LegalMail, LegalPage, legalInfo } from "@/components/layout/legal-page";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — AE2V" },
      {
        name: "description",
        content:
          "Éditeur, directeur de la publication, webmestre, hébergeur Vercel et propriété intellectuelle du site de l'AE2V.",
      },
      { property: "og:title", content: "Mentions légales — AE2V" },
      {
        property: "og:description",
        content: "Éditeur, webmestre et hébergement du site de l'AE2V.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/mentions-legales" },
    ],
    links: [{ rel: "canonical", href: "/mentions-legales" }],
  }),
  component: MentionsPage,
});

function MentionsPage() {
  return (
    <LegalPage
      eyebrow="Informations"
      title="Mentions légales"
      intro="Éditeur, webmestre, hébergeur et conditions d'utilisation du site AE2V."
    >
      <LegalBlock title="1. Éditeur du site">
        <p>
          <strong>{legalInfo.legalName}</strong> — {legalInfo.status}.
        </p>
        <p>
          Le site ae2v.fr est le site officiel de l'{legalInfo.legalName} et est exploité par
          l'association.
        </p>
        <ul className="space-y-1">
          <li>Siège social : {legalInfo.address}</li>
          <li>Numéro RNA : {legalInfo.rna}</li>
          <li>
            Courriel : <LegalMail />
          </li>
        </ul>
      </LegalBlock>

      <LegalBlock title="2. Directeur de la publication">
        <p>
          Directeur de la publication : {legalInfo.publicationDirector}, en qualité de président de
          l'{legalInfo.legalName}.
        </p>
      </LegalBlock>

      <LegalBlock title="3. Conception et webmestre">
        <p>
          Le site est conçu et développé par <strong>Bastian NOËL</strong> pour l'AE2V. La
          publication et l'administration du contenu restent assurées par l'association :{" "}
          {legalInfo.webmaster}. Aucune prestation externe n'assure la maintenance éditoriale.
        </p>
        <p>
          Signaler une erreur, un contenu ou un problème d'accessibilité :{" "}
          <LegalMail address={legalInfo.webmasterEmail} />.
        </p>
      </LegalBlock>

      <LegalBlock title="4. Hébergement">
        <p>
          Le site et ses données sont hébergés sur <strong>{legalInfo.host.name}</strong>, exploité
          par {legalInfo.host.company}.
        </p>
        <ul className="space-y-1">
          <li>Adresse de l'hébergeur : {legalInfo.host.address}</li>
          <li>Localisation des serveurs : {legalInfo.host.region}.</li>
          <li>
            Site de l'hébergeur :{" "}
            <a
              className="ae2v-link font-bold text-ae2v-red"
              href={legalInfo.host.site}
              rel="noopener noreferrer"
              target="_blank"
            >
              vercel.com
            </a>
          </li>
        </ul>
      </LegalBlock>

      <LegalBlock title="5. Propriété intellectuelle">
        <p>
          L'identité visuelle AE2V (nom, logo, emblème, chartes graphique et typographique), les
          textes, photographies et éléments d'interface sont la propriété de l'association ou de
          leurs auteurs respectifs. Toute reproduction, adaptation ou réutilisation, totale ou
          partielle, est interdite sans accord écrit préalable du bureau.
        </p>
        <p>
          Les marques et logos de partenaires affichés sur le site restent la propriété de leurs
          titulaires et sont utilisés avec leur autorisation.
        </p>
      </LegalBlock>

      <LegalBlock title="6. Responsabilité">
        <p>
          L'AE2V s'efforce de publier des informations exactes et à jour (dates d'événements,
          tarifs, disponibilité des produits). Des erreurs ou indisponibilités peuvent néanmoins
          survenir : l'association ne saurait être tenue responsable d'un préjudice résultant de
          l'usage du site. Les liens sortants vers des sites tiers n'engagent pas l'association.
        </p>
      </LegalBlock>

      <LegalBlock title="7. Données et cookies">
        <p>
          Cette version publique ne propose ni compte, ni formulaire connecté, ni espace personnel.
          Elle n'utilise <strong>aucun cookie de mesure d'audience ni de publicité</strong>.
        </p>
      </LegalBlock>

      <LegalBlock title="8. Accessibilité">
        <p>
          L'AE2V vise la conformité au RGAA 4.1 : navigation clavier complète, lien d'évitement,
          contrastes contrôlés, respect du mouvement réduit, animations pouvant être mises en pause
          et curseur personnalisé désactivé en contrastes forcés. Aucun audit officiel n'a encore
          été réalisé : le site est déclaré <strong>partiellement conforme</strong>. Si une page
          vous est inaccessible, écrivez à <LegalMail /> pour obtenir le contenu par un autre moyen.
        </p>
      </LegalBlock>

      <LegalBlock title="9. Droit applicable">
        <p>
          Les présentes mentions sont soumises au droit français. Tout litige relève des
          juridictions françaises compétentes, après tentative de résolution amiable auprès du
          bureau.
        </p>
      </LegalBlock>
    </LegalPage>
  );
}
