# 05 — Pages, composants et application visuelle

## 1. Homepage

### Objectif ergonomique

En moins de quelques secondes, comprendre :

- AE2V ;
- prochain événement ;
- adhésion ;
- où cliquer.

### Composition

```text
┌────────────────────────────────────────────────────────┐
│ LOGO      ÉVÉNEMENTS ADHÉRER BOUTIQUE AVANTAGES BDE  │
│                                           MON ESPACE   │
├────────────────────────────────────────────────────────┤
│                                                       │
│  TOUJOURS                         ▲                    │
│  PLUS LOIN,                    ▲  ▲ ▲      +           │
│  ENSEMBLE.                       ▲                    │
│                                                       │
│  Le BDE de l'IUT de Vélizy       • • • •             │
│                                  • • • •             │
│  [ VOIR LES ÉVÉNEMENTS ]                              │
│                                                       │
└────────────────────────────────────────────────────────┘
```

### Visuel

- fond off-white ou noir ;
- grand titre noir / rouge ;
- cristaux rouges ;
- petit nuage de points ;
- croix ;
- trait oblique ;
- CTA vert ;
- grain léger.

### Ergonomie

Le décor ne doit jamais séparer visuellement le titre de son CTA.

---

# 2. Prochain événement

Doit être une vraie section éditoriale, pas une simple card.

```text
01.
PROCHAIN
ÉVÉNEMENT

17 SEPT.
AFTERWORK AE2V
19:00 · Vélizy

4 € adhérent
7 € public

82 PLACES

[ PRENDRE MA PLACE ]
```

Le nombre de places peut être un ruban ou label.

---

# 3. EventCard

Contenu obligatoire :

- affiche ;
- date ;
- titre ;
- heure ;
- lieu ;
- prix ;
- état ;
- CTA.

État visuel :

```text
OUVERT     → vert accent
COMPLET    → rouge/noir
BIENTÔT    → noir/off-white
TERMINÉ    → gris
```

Ne pas coder uniquement par couleur : toujours texte + éventuellement icône.

---

# 4. Page événement

## Above the fold mobile

Ordre :

```text
Affiche
État / ruban
Titre
Date
Lieu
Prix
Disponibilité
CTA
```

Le paragraphe long vient ensuite.

### CTA sticky

Autorisé si :

- il ne masque pas le contenu ;
- il ne masque pas le focus ;
- il disparaît ou s'adapte quand le CTA principal est visible selon stratégie ;
- il respecte safe-area.

---

# 5. Page adhérer

Sections :

```text
01 HERO
02 POURQUOI ADHÉRER
03 AVANTAGES
04 TARIF / VALIDITÉ
05 COMMENT ÇA MARCHE
06 CARTE / QR
07 FAQ
08 CTA
```

### Visuel

C'est une page forte.

Utiliser :

- rouge ;
- gros titres ;
- numéros ;
- ruban vert sur l'avantage central ;
- cristaux ;
- photo campus / événement ;
- grilles de points.

### Ergonomie

Ne pas transformer l'argumentaire en 12 cards identiques.

---

# 6. Carte adhérent

Doit être lisible en 1 seconde.

```text
AE2V

PRÉNOM NOM
ADHÉRENT 2026–2027

[ QR ]

N° membre si utilisé
```

Le QR est la zone fonctionnelle ; aucun décor ne doit entrer dans sa zone de scan.

---

# 7. Billet événement

```text
SOIRÉE D'INTÉGRATION
17 SEPT · 19:00
VÉLIZY

[ QR ]

ADHÉRENT
BILLET #XXXX
```

Ajouter :

- bouton luminosité maximale si techniquement approprié et autorisé ;
- code de secours textuel ;
- statut.

---

# 8. Boutique

## ProductCard

Plus visuelle qu'une carte SaaS.

```text
[ PHOTO ]

SWEAT AE2V
45 €

→ VOIR
```

La couleur verte ne doit pas être utilisée sur chaque produit.

## Product detail

Hiérarchie :

- galerie ;
- nom ;
- prix ;
- variantes ;
- stock ;
- CTA ;
- description.

---

# 9. Panier / checkout

Visuellement plus calme.

La charte reste présente via :

- titres ;
- traits ;
- boutons ;
- petites croix ;
- accent rouge.

Éviter les cristaux massifs pendant la saisie de paiement.

---

# 10. Espace étudiant

Le dashboard doit être priorisé par urgence.

Exemple :

```text
BONJOUR LÉA

AUJOURD'HUI
[ BILLET — SOIRÉE — AFFICHER QR ]

À FAIRE
[ COMMANDE PRÊTE À RETIRER ]

MON ADHÉSION
ACTIVE · 2026–2027

MES AVANTAGES
Voir →
```

Pas besoin de 8 cartes identiques.

---

# 11. Bureau

Design moins décoratif.

Conserver :

- couleurs ;
- typo ;
- traits ;
- labels.

Réduire :

- textures ;
- cristaux ;
- rubans.

Les tables doivent rester denses et lisibles.

---

# 12. Composants

## Design system

```text
Button
IconButton
TextLink
Input
Textarea
Select
Checkbox
Radio
Switch
Dialog
Drawer
Toast
Alert
Status
Progress
Tabs
Breadcrumb
Pagination
DataTable
```

## AE2V visual components

```text
ImpactTitle
SectionNumber
CrystalCluster
DotCloud
CrossMarker
FrameCorners
DiagonalStripe
EditorialUnderline
TapeLabel
GrainOverlay
```

## Métier

```text
EventCard
EventStatus
MembershipCard
TicketCard
ProductCard
CartLine
OrderStatus
BenefitCard
PartnerLogo
MemberCard
ScannerResult
```

---

# 13. Règle de composition pour Lovable

Chaque page doit être générée en deux couches mentales :

```text
COUCHE 1 — UX
contenu, hiérarchie, action, état, formulaire

COUCHE 2 — IDENTITÉ
couleur, titre, cristaux, lignes, rubans, grain
```

La couche 2 ne doit jamais casser la couche 1.

# 14. Page équipe — interaction carte de visite

## Liste

La page `/bde/equipe` doit valoriser les personnes plutôt que présenter un simple trombinoscope.

Organisation possible :
- intro courte ;
- filtre ou regroupement par pôle si réellement utile ;
- grille de TeamCards ;
- CTA `Rejoindre le BDE`.

## TeamCard compacte

Doit montrer au minimum :
- photo ;
- nom ;
- poste ;
- pôle.

Toute la carte est une action de consultation.

Feedback au hover/focus :
- bord / trait change ;
- petit mouvement ou déplacement graphique ;
- curseur/pointeur ;
- focus visible ;
- micro-indication `Voir la fiche`.

## Transformation

Au clic :
```text
TEAM CARD DANS LA GRILLE
        ↓
se détache
        ↓
se centre
        ↓
s'agrandit
        ↓
CARTE DE VISITE
```

La transformation ne doit pas provoquer de saut de layout visible dans la grille.

## Carte de visite

Afficher :
- nom ;
- rôle/statut ;
- pôle ;
- public_ae2v_email ;
- année/mandat ;
- département si public ;
- bio facultative ;
- CTA `Écrire un mail`.

`mailto:` seulement sur l'adresse validée.

## Fermeture

- X / bouton clair ;
- Escape ;
- backdrop facultatif ;
- focus retour carte.

## Navigation entre membres

Option P1 :
- précédent / suivant dans la fiche ;
- clavier flèches uniquement si cela reste accessible et compréhensible.

Ne pas implémenter en V1 si cela complexifie le focus.

## Erreurs / absence

Sans email :
- ne rien inventer ;
- cacher le CTA mail ;
- garder la fiche complète avec poste/pôle.

Sans photo :
- fallback graphique AE2V avec initiales ou emblème neutre ;
- ne pas générer de faux portrait.
