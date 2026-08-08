# AE2V — Project Knowledge V2

## Mission
AE2V est le BDE de l'IUT de Vélizy. Construire une plateforme, pas une simple vitrine.

3 espaces :
- PUBLIC = découvrir : événements, adhésion, boutique, avantages, BDE.
- `/espace` = étudiant : carte, billets, événements, commandes, avantages, profil.
- `/bureau` = équipe : adhérents, événements, scanner, boutique, contenu, partenaires, rôles, exports.

Principe : **Découvrir → Participer → Gérer**.

## Navigation
Public :
- Événements
- Adhérer
- Boutique
- Avantages
- Le BDE
- Mon espace

`Membres` n'est pas une entrée principale ; l'équipe vit sous `Le BDE`.

## Brand — priorité très forte
Le résultat doit être immédiatement identifiable comme AE2V, PAS comme un template SaaS.

Couleurs :
- red #D60106 = base principale
- dark red #AA0005
- black #090908
- off-white #F3F1EC
- gray #D6D6D6
- acid green #BCE707 = accent / CTA / info à faire ressortir

Typo :
- impact court : Albireo Extra Condensed Black
- H1 : Anton
- H2 web : Red Hat Display Bold
- body : Raleway Medium

Style :
- éditorial
- néo-brutaliste
- géométrie carrée / dure
- gros titres très impactants
- compositions asymétriques
- cristaux / triangles facettés
- nuages et grilles de points
- croix / repères
- traits obliques
- cadres et coins
- soulignements épais
- rubans / tapes ponctuels
- texture grain / impression légère
- photos réelles contrastées

Radius :
- 0–8 px par défaut
- 12 px max exceptionnel
- éviter pills et rounded-3xl partout

Green rule :
le vert acide est rare et signifiant. Utiliser surtout pour CTA primaire, état actif, succès ou information prioritaire. Ne pas mettre plusieurs gros CTA verts concurrents dans une même section.

Decorative rule :
max 2–3 familles de motifs décoratifs par section en général. Le décor ne masque jamais contenu, focus, formulaire, QR ou CTA.

Avoid :
- generic SaaS/shadcn look
- glassmorphism
- pastel gradients
- purple/blue default UI
- soft shadow cards everywhere
- fake testimonials
- fake partners
- Lorem ipsum
- generic corporate illustrations
- excessive animation

## 10 UX rules
1. Always show system status and feedback.
2. Use student/BDE language, never database jargon.
3. One dominant primary action per context.
4. Recognition over recall: repeat essential event/product/price information when needed.
5. Keep words, components and states consistent.
6. Prevent errors before showing errors.
7. Users can cancel, go back and edit without losing data.
8. Mobile-first: large touch targets, visible labels, correct keyboards, reduced fields.
9. Strong hierarchy; decor supports the task and never competes with it.
10. Errors state what happened and how to fix it; help appears in context.

Internal mobile target: aim for ~44×44 CSS px for important touch actions even though WCAG 2.2 minimum target criterion is 24×24 under its conditions.

## Membership
- tied to a school year
- one membership / user / school year
- PENDING, ACTIVE, EXPIRED, REVOKED, REFUNDED
- server-confirmed payment
- digital card
- opaque/signed QR
- member pricing/benefits

## Events
- publication
- registration window
- capacity
- MEMBER/PUBLIC prices
- waitlist
- registration
- payment
- ticket
- QR
- check-in
- scanner role

## Shop
- products + variants
- stock
- multi-item cart
- orders + order_lines
- price snapshots
- server-calculated totals
- status: PENDING_PAYMENT, PAID, PREPARING, READY, COMPLETED, CANCELLED, REFUNDED
- money in integer cents

## Data
Core tables:
profiles, school_years, memberships, team_positions, role_assignments,
events, event_price_tiers, event_registrations, tickets, checkins,
products, product_variants, inventory_movements, carts, cart_items,
orders, order_lines, payments, partners, benefits, articles, media,
short_links, email_deliveries, audit_logs.

## Security
Frontend is untrusted.
Never:
- store secrets client-side
- trust client prices
- allow self-assigned roles
- use public/permissive RLS for private data
- encode raw user IDs in QR
- use display position as security role

Sensitive mutations require server-side auth + authorization + validation.
User private data is owner-only.
Public sees only published/public data.
Audit critical actions.

## Backend
Respect the current Lovable-generated stack.
Do not introduce Nuxt/Vue into the new project.
Use Lovable Cloud/Supabase patterns already selected.
Prefer Europe region before Cloud initialization for a France-focused new project if available.
Use storage for event/product/team/partner media.

## Forms
- visible labels
- labels above fields on mobile
- preserve values after errors
- specific error copy
- use autocomplete/inputmode
- reduce redundant fields
- show total before payment

## Accessibility
- keyboard
- visible focus
- focus not obscured
- semantic HTML
- labels
- contrast
- reduced motion
- status never color-only

## Content
Use real content or explicit empty states.
Never invent production partners, attendance, prices, testimonials or team members.

## SEO
Final canonical host: `bde-velizy.fr`.
Never reuse `ae2v.ejnalo.me`.
Do not index `/espace`, `/bureau`, auth, cart or checkout.
Use sitemap, robots, unique metadata, OG and structured data where relevant.

## Development
Use Plan mode for complex architecture.
Build one component/feature at a time.
State exact routes/files/tables affected.
Add guardrails for what must NOT change.
Do not modify unrelated files.
Verify mobile + one authorized role + one unauthorized role before declaring success.

## Team interaction
On `/bde/equipe`, TeamCards are interactive signature components.
Click/tap/keyboard opens a shared-element-style transformation: selected card detaches, centers and expands into an AE2V business card.

Expanded card can show:
- photo
- full name
- public role/status
- pole
- school year/mandate
- optional public department/bio
- `public_ae2v_email`

Email rule:
- only real stored public professional email
- must end in `@ae2v.fr`
- never invent an address
- never expose personal email
- hide mail action if absent

Accessibility:
treat expanded state as accessible dialog: focus trap, Escape close, close button, return focus to originating card, reduced-motion fallback.
Visual: square/hard AE2V card, strong type, red/black/off-white, minimal acid green, small crystal/points/cross/tape details.
