# 16 — Prompt de démarrage Lovable avec le ZIP

## Important avant utilisation

La documentation actuelle de Lovable permet d'attacher des fichiers comme contexte, mais ne garantit pas qu'un ZIP joint puisse être « importé comme code source » dans un projet existant.

Lovable ne permet pas non plus de démarrer un projet en important directement un dépôt GitHub externe.

Donc ce prompt demande une procédure sûre :

1. inspecter le ZIP ;
2. utiliser les MD comme documentation ;
3. créer/recréer uniquement la documentation dans le projet si l'agent peut le faire ;
4. placer `AGENTS.md` à la racine ;
5. ne PAS extraire le legacy dans `src/` ;
6. ne toucher à aucune application tant que le plan n'est pas validé ;
7. dire explicitement si l'archive ne peut pas être matérialisée dans le repo plutôt que prétendre l'avoir fait.

---

## Structure cible dans le projet Lovable

```text
/
├── AGENTS.md
├── docs/
│   └── ae2v/
│       ├── 00-START-HERE.md
│       ├── 01-VISION-ORGANISATION-PRODUIT.md
│       ├── 02-ARCHITECTURE-UX-SITEMAP.md
│       ├── 03-CHARTE-DESIGN-VISUEL.md
│       ├── 04-ERGONOMIE-10-REGLES.md
│       ├── 05-PAGES-PARCOURS-COMPOSANTS.md
│       ├── 06-DATA-SECURITY-BACKEND.md
│       ├── 07-BACKOFFICE-BUREAU.md
│       ├── 08-ROADMAP-TESTS-DOD.md
│       ├── 09-LOVABLE-PROJECT-KNOWLEDGE-V2.md
│       ├── 11-LOVABLE-MASTER-PROMPT-V2.md
│       ├── 12-LOVABLE-PROMPTS-ATOMIQUES-V2.md
│       ├── 13-LOVABLE-SKILL-UX-AUDIT.md
│       ├── 14-CHECKLIST-VISUEL-ERGONOMIE.md
│       └── 15-SOURCES-RECHERCHE.md
└── ... code Lovable existant inchangé
```

`10-AGENTS.md` du ZIP doit devenir `/AGENTS.md`.

---

## Prompt exact à donner avec le ZIP

```text
I attached the AE2V specification ZIP to this prompt.

IMPORTANT:
This is a BOOTSTRAP / CONTEXT INSTALL task, not an application implementation task.

DO NOT:
- rebuild the app
- edit src/
- edit routes
- edit package.json
- install dependencies
- create database tables
- run migrations
- change auth
- change Lovable Cloud
- change Supabase
- publish
- overwrite existing application code
- extract legacy application source into the new app

FIRST:
Inspect the attached ZIP and list its files.
Confirm that you can read its Markdown contents.

The ZIP contains documentation/specification files, not a codebase to blindly import.

TARGET DOCUMENTATION LAYOUT:
Create or recreate documentation inside the current Lovable project's codebase as:

/docs/ae2v/00-START-HERE.md
/docs/ae2v/01-VISION-ORGANISATION-PRODUIT.md
/docs/ae2v/02-ARCHITECTURE-UX-SITEMAP.md
/docs/ae2v/03-CHARTE-DESIGN-VISUEL.md
/docs/ae2v/04-ERGONOMIE-10-REGLES.md
/docs/ae2v/05-PAGES-PARCOURS-COMPOSANTS.md
/docs/ae2v/06-DATA-SECURITY-BACKEND.md
/docs/ae2v/07-BACKOFFICE-BUREAU.md
/docs/ae2v/08-ROADMAP-TESTS-DOD.md
/docs/ae2v/09-LOVABLE-PROJECT-KNOWLEDGE-V2.md
/docs/ae2v/11-LOVABLE-MASTER-PROMPT-V2.md
/docs/ae2v/12-LOVABLE-PROMPTS-ATOMIQUES-V2.md
/docs/ae2v/13-LOVABLE-SKILL-UX-AUDIT.md
/docs/ae2v/14-CHECKLIST-VISUEL-ERGONOMIE.md
/docs/ae2v/15-SOURCES-RECHERCHE.md

Copy the content of:
10-AGENTS.md
to:
/AGENTS.md

If /AGENTS.md already exists:
DO NOT overwrite it silently.
Compare both versions and propose a merge first.

If /docs/ae2v already exists:
compare before overwriting.
Preserve any newer project-specific decisions.

IMPORTANT LIMITATION HANDLING:
If attached ZIP files can be read as context but cannot be directly copied/extracted into the project filesystem:
- DO NOT claim that extraction succeeded.
- Do not invent file contents.
- tell me exactly which files you can read;
- use them as current conversation context;
- then tell me the smallest manual step required to place them in the repo.
Continue with the audit only after clearly reporting this limitation.

AFTER DOCUMENTATION IS AVAILABLE:
Read ALL AE2V docs before reasoning about the app.

Treat these as hierarchy:
1. current explicit user instructions
2. /AGENTS.md
3. Project Knowledge
4. /docs/ae2v specifications
5. current codebase conventions
6. legacy only as functional reference

SPECIAL TEAM REQUIREMENT:
On /bde/equipe, TeamCards must transform on click/tap/keyboard into a centered AE2V business card.
Expanded card shows only real public data:
- photo
- name
- role/status
- pole
- mandate/year
- public_ae2v_email

The email must be explicitly stored and end in @ae2v.fr.
Never invent firstname.lastname@ae2v.fr.
Never expose personal/auth email.
The expanded card must be an accessible dialog behavior with Escape, close button, focus return and reduced-motion fallback.

BRAND NON-NEGOTIABLE:
- dominant red #D60106
- dark red #AA0005
- black #090908
- off-white #F3F1EC
- acid green #BCE707 only for important highlights/actions
- hard square geometry
- big impactful titles
- Anton / Red Hat Display / Raleway / Albireo roles
- faceted triangles/crystals
- dot clouds
- crosses
- diagonal lines
- graphic underlines
- tape/ribbons
- subtle grain
- no generic SaaS appearance

ERGONOMICS:
Apply the 10 rules from /docs/ae2v/04-ERGONOMIE-10-REGLES.md.

THEN STOP IMPLEMENTING AND DO ONLY AN AUDIT.

AUDIT OUTPUT:
1. Confirm documentation files actually available.
2. Detect the real current stack.
3. List existing routes.
4. List existing reusable components.
5. Identify current data/backend/auth state.
6. Compare the app against AE2V specs.
7. List conflicts between current code and specs.
8. List P0 risks.
9. Identify whether public_ae2v_email already exists for team members.
10. Propose the first atomic implementation phase only.

FIRST PHASE MUST BE LIMITED TO:
- design tokens
- font setup/fallbacks
- AE2V graphic primitives
- accessible UI primitives
- public shell/navigation/footer

DO NOT implement that phase yet.

Ask exactly 3 architecture-changing clarification questions before presenting the final implementation plan.

At the end, wait for my approval.
```

---

# Étape suivante

Après que Lovable a :

- confirmé les fichiers,
- audité le projet,
- posé ses 3 questions,
- produit son plan,

alors seulement utiliser le prompt maître :

```text
/docs/ae2v/11-LOVABLE-MASTER-PROMPT-V2.md
```

ou le coller depuis le fichier local.

Ne pas lancer simultanément le prompt maître et les prompts atomiques.
