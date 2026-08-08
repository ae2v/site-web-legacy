# AE2V — Site Temporaire du BDE de Vélizy

> **Version Temporaire** : Plateforme interactive du BDE AE2V (IUT de Vélizy) développée et déployée dans l'attente de la version finale par Loan Jean.

---

## 🚀 Présentation

Ce site fournit à la communauté étudiante de l'IUT de Vélizy et au bureau de l'association (AE2V) l'ensemble des fonctionnalités opérationnelles :
1. **Découverte publique** : Présentation du BDE, actualités, agenda des événements, boutique et avantages partenaires.
2. **Espace Étudiant (`/espace`)** : Carte de membre numérique avec QR code, accès aux billets réservés et suivi des commandes boutique.
3. **Back-office Bureau (`/bureau`)** : Gestion et validation des dossiers d'adhésion, traitement des candidatures et suivi des événements.
4. **Configuration Système (`/setup`)** : Interface d'administration protégée par mot de passe maître (`ae2v-admin-2026` par défaut) pour la gestion du site et le test du serveur SMTP.

---

## 🛠️ Stack Technique

- **Framework** : [TanStack Start](https://tanstack.com/router) (React 19 + Vite + Nitro SSR)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS v4 + Design System AE2V (#D60106 Rouge, Anton & Red Hat Display)
- **Persistance** : Hybride (Stockage dynamique local / ready pour base de données Supabase ou Vercel KV)
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

---

## 🔐 Démonstration & Administration

### Comptes de démonstration préconfigurés
Sur la page `/connexion`, vous pouvez utiliser les accès rapides :
- **Camille Rousseau** (Présidente / Bureau Admin) : `presidence@ae2v.fr`
- **Hugo Nguyen** (Bureau Événementiel) : `hugo.demo@ae2v.fr`
- **Inès Faure** (Membre Cotisante) : `ines.demo@etu.uvsq.fr`
- **Noa Perrin** (Membre Non Cotisant) : `noa.demo@etu.uvsq.fr`

### Accès à la page `/setup`
La page d'administration globale et SMTP `/setup` est protégée par le mot de passe maître :
```text
ae2v-admin-2026
```

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
