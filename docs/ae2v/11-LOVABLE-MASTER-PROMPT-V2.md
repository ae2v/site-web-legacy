# 11 — Prompt maître Lovable V2

## Utilisation

1. Ajouter les specs + charte + legacy aux fichiers du projet/conversation.
2. Coller `09-LOVABLE-PROJECT-KNOWLEDGE-V2.md` dans Project settings → Knowledge.
3. Ajouter `10-AGENTS.md` à la racine sous le nom `AGENTS.md`.
4. Passer en **Plan mode**.
5. Coller ce prompt.
6. Ne pas approuver tant que sitemap, rôles, data model, UX et système visuel ne sont pas corrects.

---

```text
ACT AS:
Agis comme une équipe composée de :
- Senior Product Designer spécialisé en ergonomie mobile et services étudiants,
- Brand / Art Director chargé de traduire strictement une charte graphique éditoriale néo-brutaliste,
- Senior Full-Stack Architect obsédé par la sécurité, la maintenabilité et la dette technique.

Ta priorité est de produire un produit AE2V très identifiable visuellement ET très facile à utiliser.

MODE:
Nous sommes en PLAN MODE.
NE MODIFIE AUCUN CODE.
NE LANCE AUCUNE MIGRATION.
NE CRÉE AUCUNE TABLE.
NE CHANGE AUCUNE DÉPENDANCE.

Lis d'abord :
- la charte graphique AE2V V0.9.3 ;
- le code legacy fourni ;
- l'analyse existante ;
- tous les fichiers MD de spécification ;
- Project Knowledge ;
- AGENTS.md.

Le legacy est une référence fonctionnelle, pas une architecture à copier.

====================================================
1. PRODUCT
====================================================

AE2V est le BDE de l'IUT de Vélizy.

Le produit a 3 espaces :
PUBLIC = Découvrir
/espace = Participer
/bureau = Gérer

Navigation publique :
Événements
Adhérer
Boutique
Avantages
Le BDE
Mon espace

Le trombinoscope n'est pas une entrée principale.

Le produit doit permettre sur mobile :
- voir le prochain événement ;
- adhérer ;
- voir avantages ;
- prendre une place ;
- afficher billet/QR ;
- acheter boutique ;
- suivre commande.

Le bureau doit :
- gérer adhérents ;
- événements ;
- participants ;
- billets ;
- scanner ;
- shop ;
- stock ;
- commandes ;
- contenu ;
- partenaires ;
- droits ;
- exports.

====================================================
2. VISUAL IDENTITY — PRIORITÉ MAJEURE
====================================================

Le site DOIT immédiatement ressembler à la charte AE2V.
Si le résultat ressemble à un template SaaS/shadcn standard, le plan visuel est considéré raté.

PALETTE:
#D60106 = rouge dominant
#AA0005 = rouge sombre
#090908 = noir profond
#F3F1EC = blanc cassé
#D6D6D6 = gris
#BCE707 = vert acide, utilisé seulement pour attirer l'attention là où c'est utile

TYPOGRAPHIES:
Impact court / display : Albireo Extra Condensed Black
H1 : Anton
H2 web : Red Hat Display Bold
Body : Raleway Medium

LANGAGE VISUEL OBLIGATOIRE:
- gros titres très impactants et condensés
- gros numéros de sections : 01. 02. 03.
- blocs rouges/noirs/off-white
- formes carrées, angles durs
- radius faible : 0–8 px par défaut
- cristaux et triangles facettés
- nuages/grilles de points
- petites croix et repères techniques
- traits inclinés / bandes obliques
- cadres / coins incomplets
- soulignements graphiques épais
- rubans/tapes papier pour mots prioritaires
- grain / texture imprimée très légère
- photos réelles fortement contrastées ou désaturées

GREEN RULE:
Le vert acide est un signal.
Utilise-le surtout pour :
- CTA primaire
- état actif
- succès
- disponibilité
- info prioritaire
Ne mets pas plusieurs gros CTA verts concurrents dans le même contexte.

DECORATION RULE:
Max ~2–3 familles de motifs décoratifs par section en général.
Le décor ne passe JAMAIS devant :
- le contenu
- le CTA
- un formulaire
- un focus clavier
- un QR
- le scanner
- le total d'un paiement

INTERDIT:
- glassmorphism
- gradients pastel
- violet/bleu SaaS
- cartes rounded-3xl partout
- soft shadows génériques partout
- corporate illustrations
- faux témoignages
- faux partenaires
- Lorem ipsum
- uniformité de 12 cards identiques
- décor qui provoque scroll horizontal
- grain lourd sur les formulaires

====================================================
3. ERGONOMIE — 10 RÈGLES
====================================================

Applique et vérifie explicitement ces 10 règles dans ton plan :

1. VISIBILITÉ DE L'ÉTAT
Chaque action fournit un feedback immédiat :
loading, succès, erreur, progression, statut.

2. LANGAGE RÉEL
Parler étudiant/BDE et jamais jargon de base de données.

3. ACTION PRINCIPALE
Une action dominante par contexte.
Le vert acide peut la porter.

4. RECONNAISSANCE > MÉMOIRE
Répéter les informations utiles au bon moment :
event/date/prix dans checkout, produit/variante/total dans panier.

5. COHÉRENCE
Mêmes mots, mêmes composants, mêmes états, mêmes comportements.

6. PRÉVENTION DES ERREURS
Empêcher les mauvaises actions avant de produire des erreurs :
double billet, mauvaise variante, stock, destructive actions.

7. CONTRÔLE / LIBERTÉ
Retour, annulation, correction, édition, données préservées après erreur.

8. MOBILE / TOUCH / FORM
Mobile-first.
Labels visibles, au-dessus des champs sur mobile.
Bon inputmode/autocomplete.
Réduire les champs.
Cible tactile importante interne ~44×44 px ou plus.
Ne jamais descendre sous les exigences WCAG applicables.

9. HIÉRARCHIE AVANT DÉCOR
Priorité :
titre/état → information essentielle → CTA → secondaire → décor.
La charte doit être forte sans surcharger.

10. RÉCUPÉRATION / AIDE
Erreur = ce qui s'est passé + comment corriger.
Aide contextuelle à l'endroit où le besoin apparaît.

====================================================
4. SPECIFIC UX APPLICATION
====================================================

HOMEPAGE:
- Hero très graphique.
- Gros titre.
- Prochain événement visible très tôt.
- CTA principal clair.
- Adhésion très visible.
- Pas de carte Google Maps comme section majeure.
- Éviter une grille uniforme de cartes.

EVENT:
Above-the-fold mobile doit donner :
affiche, titre, date, lieu, prix, disponibilité, CTA.
CTA sticky mobile possible si accessible et non obstruant.
État explicite : ouvert / bientôt / liste attente / complet / fermé / passé.

MEMBERSHIP:
Flow court.
Afficher tarif, année, durée.
Éviter ressaisie.
Préserver données.
Paiement confirmé serveur.
Carte + QR ensuite.

SHOP:
Panier multi-articles.
Variante visible.
Total toujours clair.
Checkout calme visuellement.
Labels au-dessus.
Ne pas exiger des Apply buttons inutiles sauf cas comme promo si retenu.

STUDENT SPACE:
Prioriser urgence :
billet aujourd'hui > commande prête > membership > avantages.
Ne pas afficher 8 KPI cards génériques.

BUREAU:
Dashboard orienté tâches :
À traiter > KPI > graphiques.
Les listes « à traiter » ouvrent une vue filtrée.
Moins de décoration que le public.

SCANNER:
Écran mono-tâche.
Résultat massif immédiat.
Vert + symbole/texte pour valide.
Rouge + symbole/texte pour problème.
Rôle scanner minimal.

====================================================
5. DATA / SECURITY
====================================================

Modèle attendu :
profiles
school_years
memberships
team_positions
role_assignments
events
event_price_tiers
event_registrations
tickets
checkins
products
product_variants
inventory_movements
carts
cart_items
orders
order_lines
payments
partners
benefits
articles
media
short_links
email_deliveries
audit_logs

Tu peux proposer une simplification mais explique le trade-off.

NON-NEGOTIABLE SECURITY:
- frontend untrusted
- RLS réelle
- pas de role admin dans profil modifiable
- display position != permission
- montants recalculés serveur
- payment confirmation serveur
- QR opaque/signé
- secrets server/connectors
- scanner scope minimal
- audit actions critiques
- user A ne lit pas private data user B
- no private USING(true)

====================================================
6. BEFORE THE PLAN
====================================================

Pose EXACTEMENT 3 questions de clarification.
Seulement des questions qui changent réellement architecture/UX.

Priorité :
1. règles adhésion/paiement/tarifs ;
2. identité/auth étudiant ;
3. scope V1 réel.

Ne demande pas des détails déjà présents dans les specs.

====================================================
7. AFTER MY ANSWERS — PLAN OUTPUT
====================================================

Produis :

A. AUDIT LEGACY
- stack
- routes
- données
- points conservables
- dette
- risques
- incohérences

B. PERSONAS + JOBS TO BE DONE

C. SITEMAP + NAVIGATION

D. USER FLOWS
- adhésion
- événement
- boutique
- ticket
- scanner

E. ERGONOMIC REVIEW
Pour chacune des 10 règles :
- comment le futur produit l'applique
- principaux risques
- pattern de correction

F. ART DIRECTION SYSTEM
- palette
- typo
- display title rules
- grid
- square geometry
- red/green usage
- crystals
- dot clouds
- crosses
- diagonal lines
- underlines
- ribbons
- grain
- photos
- motion
- mobile adaptation
- decoration budget

G. PAGE-BY-PAGE VISUAL WIREFRAME
Au minimum :
- homepage
- events list
- event detail
- adhérer
- shop
- student space
- bureau dashboard
- scanner

Utilise des wireframes ASCII si utile.

H. COMPONENT SYSTEM
Sépare :
- UI primitives
- AE2V branded components
- business components

I. DATA MODEL
- tables
- relations
- enums
- constraints
- indexes
- public/private

J. SECURITY
- role/action matrix
- RLS strategy
- server checks
- secrets
- QR
- payment
- audit

K. TECH ARCHITECTURE
Respecte le stack réel du projet Lovable.

L. MIGRATION
legacy → new.

M. IMPLEMENTATION PHASES
Petites phases atomiques.
Pour chaque :
- goal
- files/routes/tables
- do-not-touch
- acceptance UX
- acceptance visual
- acceptance role/security
- mobile checks

N. RISKS / OPEN DECISIONS

O. PHASE 1 ONLY
Propose UNE seule première phase :
design tokens + typography + graphic primitives + UI primitives + shell public.
Pas encore de backend métier.

====================================================
8. NO AUTOPILOT
====================================================

Pas de marketing filler.
Pas de “seamless / robuste / innovant” sans sens.
Dis clairement les risques.
Ne code rien avant approbation.
Ne construis jamais 5 domaines métier en un seul passage.

SUCCESS CRITERIA:
Le plan est acceptable si :
- le site paraît clairement AE2V avant même de lire le logo ;
- le rouge domine et le vert est un accent utile ;
- les gros titres, cristaux, points, croix, lignes obliques, rubans et grain sont prévus avec règles précises ;
- les décorations ne nuisent pas à l'ergonomie ;
- les 10 règles UX sont appliquées page par page ;
- mobile/event/QR/scanner sont prioritaires ;
- permissions serveur et RLS sont solides ;
- la roadmap est atomique et testable.

N'ÉCRIS AUCUN CODE AVANT MON APPROBATION.
```

## ADDITIONAL NON-NEGOTIABLE — TEAM PAGE

On `/bde/equipe`, team cards must be a signature interaction.

Compact TeamCard:
- real photo or non-fake fallback
- full name
- display role/status
- pole
- hard/square AE2V visual

On click/tap/keyboard:
- selected card visually detaches from the grid
- moves toward viewport center
- expands/morphs
- becomes an AE2V business card
- backdrop reduces distraction

Expanded business card:
- name
- role/status
- pole
- mandate/school year
- optional public department/bio
- `public_ae2v_email`
- mail CTA

Email policy:
- show only a real stored professional address
- address must match `*@ae2v.fr`
- never infer or fabricate an address
- never reveal auth/personal email
- if absent, hide the email action

Accessibility:
- implement the expanded state semantically as an accessible dialog even if visually it morphs
- focus moves inside
- Escape closes
- visible close button
- focus returns to exact originating card
- prevent interaction with background
- respect reduced motion
- mobile ends as a near-full-screen card without overflow

Prefer existing CSS/View Transitions/layout animation capabilities.
Do not install a large animation library solely for this effect.
