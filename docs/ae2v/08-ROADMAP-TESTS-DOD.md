# 08 — Roadmap, tests et Definition of Done

## Phase 0 — Architecture

- sitemap ;
- rôles ;
- school year ;
- data model ;
- backend ;
- Project Knowledge ;
- AGENTS ;
- GitHub.

## Phase 1 — Design system

- tokens ;
- fonts ;
- buttons ;
- inputs ;
- états ;
- focus ;
- composants graphiques ;
- grain ;
- responsive shell.

## Phase 2 — Site public

- homepage ;
- events list/detail ;
- adhérer ;
- avantages ;
- boutique ;
- BDE ;
- actualités ;
- contact ;
- légal.

## Phase 3 — Auth / espace

- signup ;
- login ;
- reset ;
- profile ;
- `/espace`.

## Phase 4 — Adhésion

- membership ;
- payment ;
- card ;
- QR ;
- admin.

## Phase 5 — Événements

- registration ;
- waitlist ;
- ticket ;
- QR ;
- scanner ;
- email.

## Phase 6 — Shop

- catalogue ;
- cart ;
- checkout ;
- orders ;
- stock ;
- payment.

## Phase 7 — Partenaires

- partners ;
- benefits.

## Phase 8 — Communication

- articles ;
- media ;
- short links ;
- emails.

## Phase 9 — Bureau / pilotage

- dashboard ;
- exports ;
- audit ;
- stats.

## Phase 10 — Release

- sécurité ;
- accessibilité ;
- SEO ;
- performance ;
- tests paiements ;
- domaine.

---

# Test ergonomique par feature

Pour chaque feature vérifier :

## Compréhension

- [ ] titre dit clairement où l'on est ;
- [ ] utilisateur comprend la prochaine action ;
- [ ] aucun jargon interne.

## Feedback

- [ ] loading ;
- [ ] success ;
- [ ] error ;
- [ ] empty ;
- [ ] disabled state expliqué.

## Contrôle

- [ ] retour ;
- [ ] annulation ;
- [ ] correction ;
- [ ] formulaire non vidé après erreur.

## Mobile

- [ ] 320 px ;
- [ ] 375 px ;
- [ ] 768 px ;
- [ ] aucune action tactile minuscule ;
- [ ] clavier mobile approprié.

## Accessibilité

- [ ] clavier ;
- [ ] focus visible ;
- [ ] focus non masqué ;
- [ ] label ;
- [ ] contrastes ;
- [ ] reduced motion ;
- [ ] statuts non basés sur couleur seule.

## Charte

- [ ] rouge dominant ;
- [ ] vert utilisé comme accent réel ;
- [ ] typo conforme ;
- [ ] angles durs ;
- [ ] motifs AE2V présents sans surcharge ;
- [ ] gros titre structurant ;
- [ ] grain contrôlé.

---

# Definition of Done

Une fonctionnalité est terminée si :

- [ ] happy path ;
- [ ] edge cases ;
- [ ] loading ;
- [ ] empty ;
- [ ] error ;
- [ ] mobile ;
- [ ] keyboard ;
- [ ] authorized role ;
- [ ] unauthorized role ;
- [ ] cross-user access impossible ;
- [ ] validation serveur ;
- [ ] design AE2V ;
- [ ] ergonomie 10 règles ;
- [ ] pas d'erreur console/build ;
- [ ] commit stable.
