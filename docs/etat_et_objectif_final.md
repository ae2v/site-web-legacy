# État des Lieux et Objectif Final — AE2V

> Ce document décrit l’état actuel de la refonte AE2V et les derniers éléments de mise en production.

---

## 1. État des Lieux Actuel (Diagnostic)

### Assets & Identité Visuelle

- **Couleurs & Marque** : Implémentation solide de la charte (#D60106 rouge, #AA0005 rouge sombre, #090908 noir, #F3F1EC off-white, #BCE707 vert acide).
- **Typographie** : Anton, Red Hat Display, Raleway intégrés via Google Fonts.
- **Éléments graphiques** : Cristaux facettés, grilles de points, lignes d'angles, rubans et esthétique brute/cassée conformes aux règles de marque.
- **Curseur personnalisé** : Présent (`BrandCursor`), mais nécessite des options de contrôle (toggle d'activation / fallback tactile ergonomique).

### Architecture & Navigation (Routes)

- `/` : Page d'accueil complète (Hero, Événements, Avantages, FAQ, CTA), sans module Actualités.
- `/bde` : Hub de présentation du BDE (Pages Équipe et Association, sans présentation publique des pôles).
- `/evenements` : Liste et fiche détaillée des événements avec billetterie.
- `/boutique` : Aperçu minimal des produits HelloAsso avec redirection externe.
- `/adherer` : Formulaire d'adhésion et de cotisation.
- `/espace` : Espace étudiant (carte membre, billets, commandes, préférences email).
- `/bureau` : Back-office de gestion (Validation des dossiers, candidatures, membres, événements).
- `/connexion` : Page de connexion avec comptes de démo.
- `/contact` : Formulaire de contact.
- Pages légales : `/mentions-legales`, `/confidentialite`, `/conditions-vente`, `/remboursements`.

### Données & Persistance

- **Architecture actuelle** : PostgreSQL via Prisma pour les flux métier, server functions protégées par session et rôle, avec miroirs locaux limités au mode démonstration.
- **Centre de gestion** : `/bureau/personnes/:personId` regroupe identité, formulaire, statuts, adhésions, paiements, commandes, billets, factures, messages et journal d’audit.

---

## 2. État cible et règles de mise en production

1. **Architecture de Données Dynamique** :
   - Rendre les listes (membres du bureau, événements, articles boutique, liens d'accès) dynamiques et éditables via stockage persistant local/DB-ready et API JSON.
2. **Système de Connexion Hybride** :
   - Vrai système d'authentification (email / mot de passe) avec persistance de session.
   - Conservation des 4 comptes de démo préconfigurés (Étudiant non cotisant, Adhérent cotisant, Membre bureau, Présidente Bureau Admin) pour démonstration facile.
3. **Configuration `/setup`** :
   - Paramètres d’interface non sensibles uniquement.
   - Aucun secret SMTP ou mot de passe maître dans le navigateur.
   - Le transport email réel est configuré côté serveur/Vercel.
4. **Circuits Fonctionnels Connectés** :
   - Traitement réel des dossiers d'adhésion (création, mise en attente, validation/refus dans le bureau).
   - Gestion dynamique des billets d'événements et des commandes boutique.
5. **Déploiement et Publication** :
   - Publication sur le dépôt GitHub `https://github.com/ae2v/temp.bde-velizy.fr`.
   - Déploiement automatique et propre sur **Vercel**.
