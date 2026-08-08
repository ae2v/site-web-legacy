# AE2V — Bootstrap contexte + Phase 1 (design system & shell public)

## Résultat de l'inspection du ZIP

Les 18 fichiers de l'archive ont été lus intégralement (AGENTS.md, README-AE2V-BOOTSTRAP.md, et `docs/ae2v/00` à `16`). Aucun fichier n'a été copié dans le dépôt : le mode plan interdit toute écriture hors de ce plan. La copie fait partie de l'étape 0 ci-dessous, dès approbation — aucune action manuelle de ta part n'est nécessaire.

Note : l'archive ne contient pas de `docs/ae2v/10-AGENTS.md` ; c'est l'`AGENTS.md` à la racine du ZIP qui joue ce rôle.

## Audit du projet actuel (résumé)

| Sujet               | État                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Stack               | TanStack Start v1, React 19, Vite 8, TypeScript, Tailwind v4 (CSS-first), shadcn/Radix, TanStack Query, zod, sonner |
| Routes              | `__root.tsx` + `index.tsx` (placeholder vierge) uniquement                                                          |
| Composants          | `src/components/ui` (shadcn brut) ; aucun composant métier                                                          |
| Backend             | Aucun : pas de Cloud, pas d'auth, pas de table                                                                      |
| Design system       | Tokens shadcn slate par défaut, radius 0.625rem, aucune police custom                                               |
| `AGENTS.md`         | Existe, mais uniquement le bloc Lovable git → fusion, pas d'écrasement                                              |
| `public_ae2v_email` | Inexistant ; aucun modèle TeamMember                                                                                |
| Dette technique     | Faible (template neuf) ; le vrai écart est l'absence totale d'architecture AE2V                                     |
| Ergonomie           | Rien d'implémenté (page placeholder)                                                                                |
| Visuel / marque     | Look shadcn générique = exactement ce que la charte interdit                                                        |
| Sécurité            | Rien d'exposé aujourd'hui ; risques à venir : rôles, prix serveur, RLS + GRANTs, QR                                 |

Écart avec la spec : la totalité du produit (public / `/espace` / `/bureau`) reste à construire.

## Décisions retenues

- **Paiement** : aucun encaissement réel en V1. Page de paiement de démonstration explicitement marquée comme simulation, mais schéma de données conçu dès maintenant pour un vrai provider (montants en centimes entiers, totaux serveur, `payment_status`, `payment_provider`, `provider_reference`). Aucun branchement Stripe tant que tu ne le demandes pas.
- **Identité** : Google Workspace `@ae2v.fr`. Connexion Google (Lovable Cloud) + email/mot de passe pour les étudiants. Le domaine `@ae2v.fr` **vérifié** sert de signal d'appartenance au bureau, mais jamais seul : les rôles restent dans une table `user_roles` séparée, attribués côté serveur.
- **Périmètre V1** : plateforme complète (public, espace étudiant, bureau, boutique, billetterie, scanner) — livrée par phases.

## Étape 0 — installation du contexte (à l'approbation)

1. Créer `/docs/ae2v/` et y copier les 16 fichiers Markdown depuis le ZIP, à l'identique.
2. Fusionner `AGENTS.md` : conserver intégralement le bloc `LOVABLE:BEGIN…END` existant, puis ajouter le contenu AE2V en dessous.
3. Aucune autre modification : ni `src/`, ni `package.json`, ni backend.

## Phase 1 — design system et shell public

Objectif : rendre le site immédiatement reconnaissable comme AE2V, sans aucune logique métier.

### 1. Tokens et typographie

- `src/styles.css` : palette AE2V complète (rouge dominant, rouge foncé, noir, off-white, gris, vert acide + nuances) en `oklch`, mappée sur les tokens shadcn (`--primary` = rouge AE2V, vert réservé à un token `--signal` dédié).
- Échelle de radius dure : 0 / 4 / 8 px, 12 px exceptionnel.
- Polices chargées via `<link>` dans `__root.tsx` (Anton, Red Hat Display, Raleway depuis Google Fonts) + fallbacks Impact/Verdana. Albireo n'étant pas une police web libre, la couche « impact » utilise Anton condensé en fallback tant que tu ne fournis pas les fichiers de la charte.
- Tokens `--font-impact / --font-h1 / --font-h2 / --font-body`.

### 2. Primitives graphiques (`src/components/brand/`)

`CrystalCluster`, `DotCloud`, `CrossMarker`, `FrameCorners`, `DiagonalStripe`, `EditorialUnderline`, `TapeLabel`, `GrainOverlay`, `ImpactTitle`, `SectionNumber`.
Toutes en SVG/CSS pur, `aria-hidden`, `pointer-events-none`, sans dépendance nouvelle, avec variantes de couleur et respect de `prefers-reduced-motion`.

### 3. Primitives UI accessibles

Variantes AE2V sur Button (primaire vert acide, secondaire rouge, ghost noir), Badge/Tape, Input/Label, Card angulaire. Cibles tactiles ≥ 44 px, focus visible net, contraste AA.

### 4. Shell public

Header sticky avec navigation : Événements · Adhérer · Boutique · Avantages · Le BDE · Mon espace (pas de « Membres » en premier niveau). Menu mobile plein écran accessible (focus piégé, Échap, ≥ 44 px). Footer avec liens légaux et réseaux. Shell monté autour de `<Outlet />` dans `__root.tsx`, avec un `<main>` unique.

### 5. Page de démonstration

`/` reçoit un hero AE2V minimal (grand titre, 2 CTA, cristaux + croix + grain) servant de preuve visuelle du système. Ce n'est pas la homepage finale. Métadonnées `head()` propres (titre, description, og, twitter) remplaçant « Lovable App ».

### Hors périmètre Phase 1

Paiements, inscriptions événements, adhésion backend, boutique, scanner, migrations, base de données, homepage complète, transformation TeamCard.

## Détails techniques

- Tailwind v4 : tout en CSS-first dans `src/styles.css` (`@theme inline`, `@utility`), aucun `tailwind.config.js`.
- Aucune dépendance ajoutée. La transformation TeamCard s'appuiera plus tard sur les View Transitions natives.
- Le grain est un overlay CSS léger (3–7 %) jamais appliqué au-dessus des formulaires, du QR ni du checkout.

## Après la Phase 1

Arrêt et validation de ta part avant toute phase suivante (Cloud + auth Google Workspace, modèle de données, adhésion, billetterie, boutique, bureau, `/bde/equipe` et sa carte de visite).
