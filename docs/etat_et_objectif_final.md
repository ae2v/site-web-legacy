# État des Lieux et Objectif Final — Site Temporaire AE2V

> **Note contextuelle** : Ce site est une version temporaire interactive de la plateforme AE2V (BDE de Vélizy), déployée dans l'attente de la version finale développée par Loan Jean.

---

## 1. État des Lieux Actuel (Diagnostic)

### Assets & Identité Visuelle

- **Couleurs & Marque** : Implémentation solide de la charte (#D60106 rouge, #AA0005 rouge sombre, #090908 noir, #F3F1EC off-white, #BCE707 vert acide).
- **Typographie** : Anton, Red Hat Display, Raleway intégrés via Google Fonts.
- **Éléments graphiques** : Cristaux facettés, grilles de points, lignes d'angles, rubans et esthétique brute/cassée conformes aux règles de marque.
- **Curseur personnalisé** : Présent (`BrandCursor`), mais nécessite des options de contrôle (toggle d'activation / fallback tactile ergonomique).

### Architecture & Navigation (Routes)

- `/` : Page d'accueil complète (Hero, Actualités, Événements, Avantages, FAQ, CTA).
- `/bde` : Hub de présentation du BDE (Pages Équipe, Pôles, Association).
- `/evenements` : Liste et fiche détaillée des événements avec billetterie.
- `/boutique` : Boutique en ligne (panier multi-articles et lignes de commande).
- `/adherer` : Formulaire d'adhésion et de cotisation.
- `/espace` : Espace étudiant (carte membre, billets, commandes, préférences email).
- `/bureau` : Back-office de gestion (Validation des dossiers, candidatures, membres, événements).
- `/connexion` : Page de connexion avec comptes de démo.
- `/contact` : Formulaire de contact.
- Pages légales : `/mentions-legales`, `/confidentialite`, `/conditions-vente`, `/remboursements`.

### Données & Persistance

- **Actuellement** : Données de démo codées en dur dans `src/data/*` (`team.ts`, `events.ts`, `shop.ts`, `poles.ts`, `links.ts`) avec un stockage local React Context (`DemoSessionProvider`).
- **Limites à corriger** : Absence de persistance hybride (Real Auth + DB/JSON dynamique), formulaire d'adhésion non connecté à un stockage modifiable, absence d'interface d'administration système/SMTP.

---

## 2. Objectifs Finaux de la Version Temporaire

1. **Architecture de Données Dynamique** :
   - Rendre les listes (membres du bureau, événements, articles boutique, liens d'accès) dynamiques et éditables via stockage persistant local/DB-ready et API JSON.
2. **Système de Connexion Hybride** :
   - Vrai système d'authentification (email / mot de passe) avec persistance de session.
   - Conservation des 4 comptes de démo préconfigurés (Étudiant non cotisant, Adhérent cotisant, Membre bureau, Présidente Bureau Admin) pour démonstration facile.
3. **Espace de Configuration `/setup` Sécurisé** :
   - Création d'une page d'administration `/setup` protégée par un Master Password.
   - Gestion de la configuration globale (nom du site, année universitaire, bascule mode maintenance/démo).
   - Configuration SMTP complète (serveur, port, utilisateur, mot de passe, expéditeur, sécurité SSL/TLS) avec **outil de test d'envoi d'email intégré**.
4. **Circuits Fonctionnels Connectés** :
   - Traitement réel des dossiers d'adhésion (création, mise en attente, validation/refus dans le bureau).
   - Gestion dynamique des billets d'événements et des commandes boutique.
5. **Déploiement et Publication** :
   - Publication sur le dépôt GitHub `https://github.com/ae2v/temp.bde-velizy.fr`.
   - Déploiement automatique et propre sur **Vercel**.
