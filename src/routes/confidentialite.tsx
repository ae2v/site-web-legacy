import { createFileRoute } from "@tanstack/react-router";

import { LegalBlock, LegalMail, LegalPage, legalInfo } from "@/components/layout/legal-page";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — AE2V" },
      {
        name: "description",
        content:
          "Données collectées par l'AE2V, bases légales, durées de conservation, sous-traitants et exercice des droits RGPD.",
      },
      { property: "og:title", content: "Politique de confidentialité — AE2V" },
      {
        property: "og:description",
        content: "Traitement des données personnelles à l'AE2V, conforme au RGPD.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/confidentialite" },
    ],
    links: [{ rel: "canonical", href: "/confidentialite" }],
  }),
  component: ConfidentialitePage,
});

function ConfidentialitePage() {
  return (
    <LegalPage
      eyebrow="Données personnelles"
      title="Confidentialité"
      intro="Ce que l'AE2V collecte, pourquoi, combien de temps, et comment exercer tes droits."
    >
      <LegalBlock title="1. Responsable de traitement">
        <p>
          {legalInfo.legalName} ({legalInfo.status}) est responsable des traitements décrits
          ci-dessous. Contact unique pour toute question ou demande de droits : <LegalMail />.
        </p>
      </LegalBlock>

      <LegalBlock title="2. Données collectées et finalités">
        <ul className="space-y-2">
          <li>
            <strong>Compte étudiant</strong> — nom, prénom, adresse e-mail, formation/promo, mot de
            passe chiffré. Finalité : créer et sécuriser ton espace personnel.{" "}
            <em>Base légale : exécution du contrat d'adhésion / mesures précontractuelles.</em>
          </li>
          <li>
            <strong>Adhésion</strong> — année scolaire, statut, date, montant. Finalité : gérer la
            qualité de membre et les avantages associés.{" "}
            <em>Base légale : contrat et obligation légale de tenue de registre associatif.</em>
          </li>
          <li>
            <strong>Événements</strong> — inscriptions, billets, code de billet, émargement/scan.
            Finalité : contrôle d'accès et gestion des capacités.{" "}
            <em>Base légale : exécution du contrat.</em>
          </li>
          <li>
            <strong>Boutique</strong> — commandes, lignes de commande, statut de paiement et de
            retrait. Finalité : traitement des commandes et comptabilité.{" "}
            <em>Base légale : contrat et obligation légale comptable.</em>
          </li>
          <li>
            <strong>Communication</strong> — envoi d'informations sur la vie de l'association aux
            adhérents. <em>Base légale : intérêt légitime, avec désinscription possible.</em>
          </li>
        </ul>
        <p>
          Aucune donnée bancaire complète n'est stockée par l'association : les paiements sont
          traités par un prestataire de paiement, qui seul manipule les données de carte.
        </p>
      </LegalBlock>

      <LegalBlock title="3. Données non collectées">
        <p>
          L'AE2V ne collecte <strong>aucune donnée sensible</strong> (santé, opinions, orientation,
          origine), ne pratique <strong>aucun profilage</strong> ni décision automatisée, et ne
          revend ni ne loue jamais de données à des tiers.
        </p>
      </LegalBlock>

      <LegalBlock title="4. Cookies et traceurs">
        <p>
          Le site n'utilise <strong>aucun cookie de mesure d'audience, de publicité ou de réseau
          social</strong>. Seuls des éléments strictement nécessaires au fonctionnement peuvent être
          déposés (maintien de session lorsque tu te connectes, préférences d'affichage stockées
          localement) : ils sont exemptés de consentement au sens des recommandations de la CNIL,
          d'où l'absence de bandeau cookies.
        </p>
        <p>
          Si un outil de mesure venait à être ajouté, cette page serait mise à jour et un
          consentement préalable serait demandé.
        </p>
      </LegalBlock>

      <LegalBlock title="5. Destinataires et sous-traitants">
        <ul className="space-y-1">
          <li>
            Membres habilités du bureau AE2V, strictement selon leur rôle (adhésions, événements,
            boutique, trésorerie).
          </li>
          <li>
            Hébergeur : {legalInfo.host.name} ({legalInfo.host.company}) —{" "}
            {legalInfo.host.region}.
          </li>
          <li>
            Prestataire de paiement, pour les seules données nécessaires à la transaction.
          </li>
        </ul>
        <p>
          Les données sont hébergées dans l'Union européenne. Aucun transfert hors UE n'est réalisé
          sans encadrement contractuel approprié.
        </p>
      </LegalBlock>

      <LegalBlock title="6. Durées de conservation">
        <ul className="space-y-1">
          <li>Compte étudiant : jusqu'à sa suppression, puis effacement sous 30 jours.</li>
          <li>
            Historique d'adhésion : conservé par année scolaire pendant la durée de vie associative
            utile, puis archivé sous forme de statistiques anonymes.
          </li>
          <li>Billets et émargements : jusqu'à 12 mois après l'événement.</li>
          <li>
            Pièces comptables (commandes, reçus) : 10 ans, conformément aux obligations légales.
          </li>
        </ul>
      </LegalBlock>

      <LegalBlock title="7. Sécurité">
        <p>
          Accès aux données réservé aux rôles habilités et vérifié côté serveur, mots de passe
          chiffrés, connexions en HTTPS, cloisonnement des espaces public / étudiant / bureau, et
          journalisation des opérations sensibles.
        </p>
      </LegalBlock>

      <LegalBlock title="8. Tes droits">
        <p>
          Tu disposes des droits d'accès, de rectification, d'effacement, de limitation,
          d'opposition et de portabilité, ainsi que du droit de définir des directives post-mortem.
          Adresse ta demande à <LegalMail /> : une réponse te sera apportée dans un délai maximum
          d'un mois. Une pièce justificative pourra t'être demandée en cas de doute sur ton
          identité.
        </p>
        <p>
          En cas de désaccord, tu peux saisir la CNIL :{" "}
          <a
            className="ae2v-link font-bold text-ae2v-red"
            href="https://www.cnil.fr"
            rel="noopener noreferrer"
            target="_blank"
          >
            cnil.fr
          </a>
          .
        </p>
      </LegalBlock>
    </LegalPage>
  );
}
