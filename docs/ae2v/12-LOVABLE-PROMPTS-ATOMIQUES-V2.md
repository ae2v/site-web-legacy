# 12 — Prompts Lovable atomiques V2

## Pattern universel

```text
ATOMIC TASK:
[une seule chose]

ROLE:
[public / student / bureau / scanner / admin]

USER GOAL:
[ce que la personne veut accomplir]

CURRENT:
[ce qui existe]

EXPECTED:
1.
2.
3.

ERGONOMIC RULES TO CHECK:
[choisir les règles 1–10]

VISUAL:
- red dominant
- acid green only for priority
- hard square geometry
- large impact title
- selected AE2V motifs
- subtle grain

ALLOWED:
[files/routes/tables]

DO NOT TOUCH:
[areas]

SECURITY:
[checks]

ACCEPTANCE:
- happy
- loading
- empty
- error
- mobile
- keyboard
- authorized
- unauthorized
- visual AE2V
- UX rules

Avant de modifier :
résume ton plan en 5 lignes max.
Après :
liste fichiers changés + tests.
```

---

# 1 — Audit design actuel

```text
PLAN MODE.

Audite uniquement l'interface actuelle.

Compare :
- charte AE2V
- Project Knowledge
- 10 règles ergonomiques

Pour chaque page existante :
- score identité AE2V /10
- score hiérarchie /10
- score mobile /10
- score feedback /10
- score accessibilité /10
- problèmes
- correction la plus rentable

N'édite rien.
```

---

# 2 — Tokens

```text
AGENT MODE — ATOMIC.

Implémente uniquement les design tokens.

Couleurs :
#D60106
#AA0005
#090908
#F3F1EC
#D6D6D6
#BCE707

Typography:
Albireo impact
Anton H1
Red Hat Display H2
Raleway body

Radius :
0–8px par défaut.

Ajoute :
focus tokens
border tokens
grain variables
motion/reduced-motion tokens

DO NOT:
pages, backend, auth, data.

Vérifie contrastes et fallback fonts.
```

---

# 3 — Primitives graphiques

```text
Crée uniquement :
CrystalCluster
DotCloud
CrossMarker
FrameCorners
DiagonalStripe
EditorialUnderline
TapeLabel
GrainOverlay
ImpactTitle
SectionNumber

Contraintes :
- props contrôlées
- responsive
- aria-hidden si décoratif
- no layout shift
- no horizontal overflow
- red default
- green variant only accent
- reduced motion
- max texture weight raisonnable

Ne les place pas encore partout.
```

---

# 4 — UI primitives

```text
Crée uniquement :
Button
IconButton
Input
Textarea
Select
Checkbox
Radio
Dialog
Drawer
Alert
Toast
Status
Progress
EmptyState
Skeleton

Ergo :
- visible focus
- important touch controls ~44px+
- labels real
- errors connected
- disabled has reason where needed
- loading state

Visuel :
square/hard
no generic rounded SaaS look.
```

---

# 5 — Shell public

```text
Construis uniquement :
header
mobile menu
footer
container/layout.

Navigation :
Événements
Adhérer
Boutique
Avantages
Le BDE
Mon espace

Visuel :
strong red/black/off-white
1–2 motifs seulement dans header/footer
no clutter.

Test :
320, 375, 768, desktop
keyboard
focus
menu close/return focus.
```

---

# 6 — Hero homepage

```text
Construis UNIQUEMENT le hero de la homepage.

Objectif :
comprendre AE2V + savoir où agir.

Contenu :
TOUJOURS
PLUS LOIN,
ENSEMBLE.

Le BDE de l'IUT de Vélizy

CTA primaire : VOIR LES ÉVÉNEMENTS
CTA secondaire : DEVENIR ADHÉRENT

Art direction :
- impact title très grand
- red/black/off-white
- crystal cluster
- dot cloud
- 1 cross/marker
- acid green only on primary CTA
- subtle grain
- asymmetry
- square geometry

Ergo :
- title readable
- CTA visible
- no decor overlap
- mobile stack
- reduced motion

Ne construis aucune autre section.
```

---

# 7 — Prochain événement

```text
Construis uniquement la section Prochain événement.

Elle doit être plus éditoriale qu'une card générique.

Afficher :
date
title
time
place
member/public price
availability
CTA

Ergo rules :
1 status
2 language
3 primary CTA
9 hierarchy

Visuel :
large section number
strong red title
tape/label for availability
one diagonal/detail
green CTA
grain light.

Données mock DEV uniquement si backend absent.
```

---

# 8 — EventCard

```text
Crée EventCard :
compact + listing.

States:
open
soon
waitlist
sold-out
closed
past

No color-only status.
No green on every card.
```

---

# 9 — Page événement

```text
Construis uniquement event detail UI.

Mobile above fold :
poster
status
title
date
place
price
availability
CTA

Long description later.

Option sticky CTA mobile if:
- no focus obstruction
- safe area
- no duplicate confusing action.

Check UX rules 1,3,4,6,8,9.
```

---

# 10 — Page adhérer UI

```text
Construis uniquement la page publique Adhérer sans paiement réel.

Sections :
hero
benefits
price/validity
how it works
card preview
FAQ
CTA

Visuel fort :
red base
impact titles
numbers
crystals
dots
tape highlight
green CTA

Avoid a generic 6-card feature grid.
```

---

# 11 — Form UX audit

```text
PLAN MODE.

Audite tous les formulaires existants.

Vérifie :
- label visible
- mobile label above
- placeholder not label
- inputmode
- autocomplete
- unnecessary fields
- redundant entry
- error copy
- preserve data
- error summary for long forms
- touch target
- keyboard/focus

Donne patch plan, n'édite rien.
```

---

# 12 — Student space

```text
Construis uniquement /espace overview.

Priorité :
1 ticket today/upcoming
2 order ready
3 membership
4 benefits
5 secondary history

Do NOT make a generic grid of identical KPI cards.

Visual :
calmer than public
still AE2V
red/black/offwhite
green only urgent success/action
few markers.
```

---

# 13 — Scanner

```text
Construis uniquement /bureau/scanner.

Mono-task UI.

Results:
VALID
ALREADY_CHECKED
WRONG_EVENT
CANCELLED
UNKNOWN
NETWORK_ERROR

Valid :
acid green + check icon + text.

Problem :
red + symbol + explicit text.

No color-only.
Minimal personal data.
Large touch controls.
No heavy decor.
```

---

# 14 — Checkout UX

```text
PLAN MODE first.

Review the shop/event checkout against:
- clear total
- editable previous answers
- no redundant fields
- visible labels
- preserved data after errors
- specific errors
- mobile keyboards
- status feedback
- ability to cancel/back
- server-authoritative money

Propose smallest fixes first.
```

---

# 15 — UX + visual review before release

```text
PLAN MODE.

Audit every public and authenticated page.

For each:
- 10 ergonomic rules PASS/WARN/FAIL
- AE2V visual PASS/WARN/FAIL
- keyboard
- mobile
- focus
- error states
- loading
- empty
- role/security

VISUAL checklist:
- red dominant?
- green meaningful?
- strong title?
- square geometry?
- brand motifs?
- grain subtle?
- too many decorations?
- generic SaaS leftovers?

Rank fixes P0/P1/P2.
Do not edit until review approved.
```

# 16 — TeamCard → carte de visite

```text
ATOMIC TASK:
Construis uniquement l'interaction TeamCard de `/bde/equipe`.

ROLE:
Public visitor.

USER GOAL:
Découvrir rapidement une personne du BDE et pouvoir contacter son adresse professionnelle AE2V.

COMPACT CARD:
- photo réelle ou fallback non fictif
- full name
- display role/status
- pole
- hard/square AE2V design
- visible focus
- whole card opens details

INTERACTION:
click/tap/Enter/Space
→ selected card detaches
→ centers in viewport
→ expands/morphs
→ becomes AE2V business card.

Do not use a generic rounded modal visually.
Use existing View Transitions/shared-layout/CSS capabilities if stable.
No large dependency only for animation.

EXPANDED BUSINESS CARD:
- photo
- full name
- public role/status
- pole
- mandate/school year
- optional public department
- short bio only if real data
- public_ae2v_email
- mailto CTA

EMAIL SECURITY/DATA:
- only explicit `public_ae2v_email`
- must end with @ae2v.fr
- do not derive from name
- do not expose auth/personal email
- if null: hide email + CTA

ACCESSIBILITY:
- semantic accessible dialog behavior
- focus moved inside
- focus trapped appropriately
- Escape closes
- visible close button
- focus returns to exact originating card
- no nested links in opener button
- reduced-motion = fade/instant state, no complex morph

MOBILE:
- near-full-screen centered card with safe margins
- no horizontal overflow
- email wraps safely
- important controls ~44px+
- no decor over content

VISUAL:
- red/black/off-white
- acid green only for meaningful small accent/CTA if justified
- strong impact title/name
- 0–8px radius
- 1 small crystal
- dots OR crosses
- one underline/tape
- subtle grain

DO NOT TOUCH:
- auth
- payments
- events
- shop
- RLS outside any strictly necessary public team email field change

Before implementation:
show current TeamMember data shape and say whether `public_ae2v_email` exists.
If it does not exist, propose the smallest schema/data change and STOP for approval before migration.

ACCEPTANCE:
- mouse
- touch
- Enter/Space
- Escape
- focus return
- reduced motion
- 320px mobile
- no overflow
- no fake email
- no personal email exposure
- AE2V visual signature
```
