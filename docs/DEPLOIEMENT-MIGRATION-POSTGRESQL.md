# Déploiement de la refonte PostgreSQL

La migration applicative est versionnée dans :

```text
prisma/migrations/20260810170000_bureau_refonte/migration.sql
```

Elle ajoute les relations nécessaires à la fiche membre 360° : adhésions, paiements, lignes de commande, factures enrichies, préférences email pour les comptes et les dossiers, journal d’emails, ordre de l’équipe et l’unicité des références HelloAsso pour éviter les doubles imports.
Les fiches équipe disposent aussi d’un indicateur `publicVisible` : les anciennes fiches de démonstration sont conservées mais masquées du site public par le seed, sans suppression de données.

## Procédure contrôlée

Depuis un environnement de déploiement disposant de `POSTGRES_URL` :

Pour activer l’envoi réel des mails (corrections d’adhésion, réponses et messages
du Bureau), renseigner également `RESEND_API_KEY` et `EMAIL_FROM` dans les variables
Vercel. Sans ces variables, les messages restent volontairement en statut
`EN_ATTENTE_ENVOI` dans le journal au lieu d’être présentés comme envoyés.

1. effectuer une sauvegarde PostgreSQL vérifiée et conserver son emplacement hors du dépôt ;
2. vérifier le diff sans écriture :

   ```bash
   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma
   ```

   Le même contrôle est disponible avec `npm run db:diff`.

3. appliquer les migrations versionnées :

   ```bash
   npm run db:migrate:deploy
   ```

4. générer le client puis exécuter le seed uniquement si la base est initialisée. Le seed équipe est idempotent : il complète les membres officiels manquants et conserve les photos, emails publics et liaisons de comptes déjà configurés :

   ```bash
   npx prisma generate
   npm run db:seed
   ```

5. tester immédiatement : connexion, `/bureau/personnes`, profil 360°, confirmation de paiement, facture PDF, export email et `/espace`.

La base historique AE2V possédait déjà ses tables mais aucun historique
Prisma. Le dépôt contient donc `20260810165900_baseline`, qui décrit cet état
initial, puis `20260810170000_bureau_refonte`. Sur cette base existante, le
baseline est marqué comme appliqué et seule la refonte est exécutée ; sur une
base vide, Prisma applique les deux migrations dans l’ordre.

Ne pas utiliser `db push --accept-data-loss` en production. Si le diff ne correspond pas à l’état attendu de la base, arrêter la procédure et analyser la sauvegarde avant toute écriture.
