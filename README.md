# AE2V — Plateforme du BDE de Vélizy

> Plateforme AE2V : découverte publique, espace étudiant et opérations du Bureau.

---

## 🚀 Présentation

Ce site fournit à la communauté étudiante de l'IUT de Vélizy et au bureau de l'association (AE2V) l'ensemble des fonctionnalités opérationnelles :

1. **Découverte publique** : Présentation du BDE, agenda des événements, aperçu HelloAsso et avantages partenaires.
2. **Espace Étudiant (`/espace`)** : Carte de membre numérique avec QR code, accès aux billets réservés et suivi des commandes boutique.
3. **Back-office Bureau (`/bureau`)** : Gestion et validation des dossiers d'adhésion, traitement des candidatures et suivi des événements.
4. **Fiche membre 360°** : profil unique partagé entre recherche, scanner, adhésion, paiements, commandes, événements, factures et messages.

---

## 🛠️ Stack Technique

- **Framework** : [TanStack Start](https://tanstack.com/router) (React 19 + Vite + Nitro SSR)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS v4 + Design System AE2V (#D60106 Rouge, Anton & Red Hat Display)
- **Persistance** : PostgreSQL via Prisma pour les flux métier, avec miroir local uniquement pour la démonstration hors migration
- **Déploiement** : [Vercel](https://vercel.com) & [GitHub](https://github.com/ae2v/temp.bde-velizy.fr)

---

## 💻 Installation & Développement Local

### Prérequis

- Node.js 20+ ou Bun

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/ae2v/temp.bde-velizy.fr.git
cd temp.bde-velizy.fr

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Variables d’environnement

Copiez `.env.example` vers `.env` en développement. En production, configurez dans Vercel :

- `POSTGRES_URL` : connexion PostgreSQL ;
- `SESSION_SECRET` : secret aléatoire long, obligatoire ;
- `HELLOASSO_SHOP_URL` : URL publique HelloAsso facultative.

Ne committez jamais `.env` et ne réutilisez pas le secret de développement.

---

## 🔐 Démonstration & Administration

### Comptes de démonstration préconfigurés

Sur la page `/connexion`, vous pouvez utiliser les accès rapides :

- **Camille Rousseau** (Présidente / Bureau Admin) : `presidence@ae2v.fr`
- **Hugo Nguyen** (Bureau Événementiel) : `hugo.demo@ae2v.fr`
- **Inès Faure** (Membre Cotisante) : `ines.demo@etu.uvsq.fr`
- **Noa Perrin** (Membre Non Cotisant) : `noa.demo@etu.uvsq.fr`

### Migration de la base

Le schéma Prisma contient les tables d’adhésions, paiements, commandes, lignes de commande,
inscriptions événement, préférences email, journal et factures. La migration versionnée doit être
appliquée après sauvegarde vérifiée :

```bash
npm run db:diff
npm run db:migrate:deploy
npx prisma generate
npm run db:seed
```

Ne jamais utiliser `db push --accept-data-loss` en production. Voir
[`docs/DEPLOIEMENT-MIGRATION-POSTGRESQL.md`](docs/DEPLOIEMENT-MIGRATION-POSTGRESQL.md) pour la
procédure contrôlée.

---

## 📦 Build & Déploiement Vercel

```bash
# Vérification du build de production
npm run build

# Déploiement direct via Vercel CLI
vercel --prod
```

---

## 📄 Licence

Copyright © 2026 AE2V (Association Étudiante de Vélizy). Tous droits réservés.
