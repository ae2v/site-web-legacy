<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
# AGENTS.md — AE2V

## Core mission
Build the AE2V platform around:
- public discovery,
- student participation in `/espace`,
- staff operations in `/bureau`.

## Visual priority
This is a highly branded website.

The UI must visibly use:
- #D60106 red as dominant brand color
- #AA0005 dark red
- #090908 black
- #F3F1EC off-white
- #BCE707 acid green as controlled highlight
- Anton / Red Hat Display / Raleway / Albireo impact usage
- hard square geometry
- large impactful headings
- faceted triangular crystals
- dot clouds
- crosses and technical marks
- diagonal stripe lines
- editorial underlines
- tape/ribbon labels
- subtle grain/print texture

Do not silently simplify the brand into generic shadcn components.

## Ergonomics
Apply these rules:
1. visible system status
2. real-world/student language
3. one primary action
4. recognition over recall
5. consistency
6. error prevention
7. cancel/back/edit
8. mobile/touch/form simplicity
9. visual hierarchy before decoration
10. useful error recovery/help

Decorative elements must never interfere with:
- reading
- forms
- focus
- QR scanning
- checkout
- scanner

Aim for 44px+ important mobile touch actions.

## Stack
Respect the current Lovable/React/TypeScript stack.
Do not introduce Nuxt or Vue.

## Change discipline
Before a complex change:
1. inspect
2. plan
3. list affected areas
4. list do-not-touch areas
5. implement smallest coherent unit
6. verify
7. summarize

Do not change unrelated files.
Avoid new dependencies unless they clearly reduce complexity.

## Security
Browser is untrusted.

Never:
- client secrets
- role checks only in UI
- client-authoritative money
- raw user IDs in QR
- user-writable admin roles
- permissive private RLS

Sensitive server operation:
auth → authorize → validate → calculate → mutate → audit.

## Roles
Display titles and security roles are separate.

Test:
- authorized role
- unauthorized authenticated role
- cross-user private access

## Money
Integer cents.
Server totals.
Payment provider/server confirmation controls final paid state.

## Membership
Per school year.
Unique user + year.
Keep history.

## Events
Support:
publication, registration window, capacity, price tiers, waitlist, ticket, QR, check-in.
Prevent overselling server-side.

## Shop
Multi-item cart.
Orders use order lines.
Persist price/name snapshots.
Inventory is auditable.

## Forms
Visible labels.
Preserve values after errors.
Specific messages.
Correct autocomplete/inputmode.
Show costs before confirmation.

## Accessibility
Keyboard, focus, contrast, reduced motion, semantics.
Do not use color as the only status signal.

## Content
Never invent real-world facts.
Use empty states.

## SEO
Canonical `bde-velizy.fr`.
Do not index private/account flows.

## Done
Not done until:
- happy path
- loading
- empty if relevant
- error
- mobile
- keyboard
- authorized
- unauthorized denied
- no cross-user access
- server validation
- AE2V visual review
- 10 ergonomic rules review
- no build/console error

## Team member card interaction

`/bde/equipe` uses a branded TeamCard → business-card transformation.

Compact card:
photo, name, display role, pole.

Expanded:
photo, name, role/status, pole, mandate year, optional public info, and `public_ae2v_email`.

Email must:
- be stored explicitly;
- end with `@ae2v.fr`;
- never be guessed;
- never fall back to personal auth email.

Expanded UI must behave accessibly like a dialog:
- focus management;
- Escape;
- visible close;
- return focus;
- reduced-motion fallback.

Do not use a generic rounded modal if a stable shared-element transformation can be implemented with existing capabilities.
