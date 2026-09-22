# Plan de refonte AE2V — interfaces, Bureau et backend

Version de travail : 2026-08-11  
Statut : socle applicatif implémenté — recette métier et configuration du transport sortant à finaliser

## 0. Décision structurante

Le Bureau ne doit plus être une collection de tableaux indépendants. La source de vérité est la personne membre et sa fiche 360°.

```text
interface publique / formulaire / scanner / liste Bureau
                    ↓
           Personne membre 360°
                    ↓
adhésion · paiements · commandes · billets · factures · messages · journal
```

Toutes les entrées doivent ouvrir la même fiche :

```text
/bureau/personnes/:personId
```

Les actions sensibles partent de cette fiche et sont recalculées côté serveur. L’interface ne fait qu’afficher les droits et demander la confirmation.

## 1. État réel du dépôt

### 1.1 Déjà présent ou commencé

- Les routes `/actualites` et `/bde/poles` sont supprimées : elles ne doivent plus être accessibles, référencées dans la navigation ou alimentées par un backend dédié.
- La visibilité publique d’une fiche équipe est pilotée par `TeamMember.publicVisible`; une fiche interne peut être conservée sans être publiée sur `/bde/equipe`.
- Le modèle Prisma contient désormais les briques `Membership`, `Payment`, `OrderLine`, `EventRegistration`, `ContactMessage`, `AuditLog` et les relations principales.
- Une fiche `/bureau/personnes/:personId` existe et agrège identité, adhésions, paiements, commandes, billets et factures.
- Les fonctions serveur existent pour l’authentification, les adhésions, les paiements, les factures, les commandes HelloAsso, les événements, les billets, le check-in et les messages de contact.
- Le formulaire d’adhésion est conservé visuellement et transmet ses résultats au serveur ; le repli local est limité au mode développement.
- Le formulaire de contact est relié à `ContactMessage` et doit apparaître dans la boîte de réception Bureau.
- La liste publique des événements lit les événements publiés en base ; le fallback local est limité au mode développement.
- Les cartes membres disposent d’un fallback lorsqu’aucune photo n’est fournie.
- La liste actuelle de l’équipe reprend les membres et intitulés validés, dont **Franck MANICKAM — Chargé de l’événementiel**.
- Les imports `node:crypto` qui provoquaient des erreurs dans le navigateur ont été retirés du bundle client.
- Les préférences email serveur, la désinscription par token opaque, les listings filtrés, les routes Bureau partageables et le PDF facture simple sont maintenant branchés dans le socle applicatif.
- La confirmation d’un paiement crée une facture de manière idempotente et met à jour la commande, le billet ou la cotisation concernés.
- `/espace` recharge désormais billets, commandes, paiements et factures depuis le compte PostgreSQL authentifié ; les pages publiques événements, équipe et catalogue ne basculent vers des données locales qu’en développement.
- Les remboursements partiels sont cumulés côté serveur et les expéditeurs e-mail sont limités à l’adresse du compte Bureau authentifié.
- Le build Vercel, TypeScript et ESLint ont déjà été exécutés avec succès sur les passes précédentes.

### 1.2 Restant avant mise en production

- effectuer la recette des permissions réelles, des accès croisés et des flux payants sur la base migrée ;
- tester le parcours billet invité : scan → confirmation du paiement → facture → check-in ;
- tester les liens Bureau partageables après ouverture dans une nouvelle session ;
- configurer `RESEND_API_KEY` et `EMAIL_FROM` sur Vercel si l’envoi sortant réel est souhaité. Sans ces variables, les e-mails sont journalisés en attente d’envoi et jamais présentés faussement comme envoyés.

La migration PostgreSQL versionnée et le seed contrôlé ont été appliqués sur la base de production. Les corrections de flux ne doivent pas être considérées comme validées par le seul build : elles nécessitent la recette des rôles et des données réelles.

Les miroirs locaux restants sont uniquement des fallbacks de démonstration : les comptes réels utilisent les server functions et la source PostgreSQL.
Aucun secret SMTP, mot de passe maître ou rôle d’administration ne doit être stocké dans le navigateur ; les paramètres d’envoi réels sont des variables d’environnement serveur.

## 2. Arborescence cible

### 2.1 Interface publique

| Route                  | Objectif                                                                                    | Données sources                                                              | Liaisons Bureau                                                                        | Interface et options                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/`                    | Orienter vers les actions principales du site                                               | événements publiés, équipe dirigeante, configuration publique                | événements → gestion événements ; équipe → fiche équipe                                | hero, CTA adhérer/événements, aperçu équipe, états vide/chargement                                        |
| `/bde`                 | Présenter l’association et ses missions, sans bloc de présentation des pôles devenu inutile | association, équipe dirigeante, compteurs publics                            | équipe → `TeamMember`, association → configuration éditoriale                          | hiérarchie courte, CTA équipe/association/contact ; aucun KPI ou bloc dédié aux pôles                     |
| `/bde/association`     | Expliquer l’association, sa gouvernance et ses règles                                       | contenu éditorial validé                                                     | aucun traitement membre direct                                                         | sections éditoriales, documents, liens légaux                                                             |
| `/bde/equipe`          | Présenter les membres du bureau                                                             | `TeamMember`, photo, rôles, mandat                                           | carte → profil équipe/public ; profil public → données utilisateur publiques seulement | cartes de visite, dirigeants mis en avant, filtre pôle facultatif, placeholder photo, dialogue accessible |
| `/evenements`          | Lister les événements publiés                                                               | `Event`, tarifs, jauge                                                       | inscription et paiement → membre 360°                                                  | filtres à venir/passés, statut, prix selon session, capacité, CTA unique                                  |
| `/evenements/:eventId` | Détailler et inscrire à un événement                                                        | `Event`, `EventRegistration`, `Ticket`, `Payment`                            | inscription → fiche membre ; billet → scanner/check-in                                 | détail, tarifs, places, fenêtre d’inscription, liste d’attente, confirmation, billet                      |
| `/adherer`             | Recevoir une demande d’adhésion                                                             | formulaire → `Dossier`, puis `User`/`Membership` après validation            | dossier → demandes Bureau ; validation → membre 360°                                   | formulaire actuel conservé, validation visible, erreurs par champ, récapitulatif, consentements           |
| `/boutique`            | Montrer un aperçu minimal de la boutique HelloAsso                                          | catalogue minimal, URL HelloAsso                                             | vente importée → `Order`, `OrderLine`, `Payment`, `Invoice`, utilisateur               | image, nom, prix, information essentielle, bouton HelloAsso ; pas de panier ni newsletter                 |
| `/contact`             | Recevoir une demande du public                                                              | `ContactMessage`                                                             | message → boîte Bureau ; statut → journal                                              | formulaire accessible, sujet, consentement de réponse, confirmation, fallback mailto                      |
| `/connexion`           | Authentifier ou créer un compte membre                                                      | `User`, session serveur                                                      | session → espace et permissions Bureau                                                 | connexion, création membre, erreurs, déconnexion ; rôle jamais choisi côté client                         |
| `/espace`              | Donner au membre ses informations et actions                                                | session, `Membership`, `Payment`, `Order`, `Ticket`, `Invoice`, `TeamMember` | mêmes données filtrées par `userId`                                                    | carte membre, carte bureau si concerné, paiements, billets, commandes, factures, préférences              |
| `/mentions-legales`    | Informer sur l’association                                                                  | contenu éditorial                                                            | aucun                                                                                  | page légale lisible et responsive                                                                         |
| `/confidentialite`     | Expliquer les données stockées                                                              | politique et traitements                                                     | liens vers demandes de suppression                                                     | page légale                                                                                               |
| `/conditions-vente`    | Encadrer les achats HelloAsso                                                               | contenu légal                                                                | commande/facture                                                                       | page légale                                                                                               |
| `/remboursements`      | Expliquer les remboursements                                                                | contenu légal                                                                | liens vers commande/facture                                                            | page légale                                                                                               |

Les routes `/actualites` et `/bde/poles` doivent retourner 404. Aucun backend, modèle, lien ou entrée de menu ne doit être recréé pour ces modules. Les pôles restent uniquement des attributs de classement dans le Bureau et de l’équipe publique.

### 2.2 Interface Bureau

Les modules visuels actuels sont conservés, mais chaque onglet obtient une URL partageable. Une route profonde ne doit pas dupliquer la logique : elle sélectionne le même module et la même source de données.

| Route                                      | Objectif                                                     | Données                                                                  | Entrées/sorties liées                                                             | Interface et options                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/bureau`                                  | Dashboard opérationnel                                       | agrégats, demandes, alertes, événements, paiements                       | toutes les sections                                                               | compteurs, alertes, raccourcis, derniers éléments, état serveur                                                                                                          |
| `/bureau/scanner`                          | Scanner ou rechercher un code                                | `User.cardCode`, `Ticket.code`, référence commande/facture               | résultat → fiche membre 360°                                                      | caméra, saisie ordinateur, recherche floue, suggestions, résultat exact avant action                                                                                     |
| `/bureau/personnes`                        | Rechercher, filtrer et exporter toutes les personnes connues | `User`, `Dossier`, `Membership`, paiements, commandes, billets, factures | chaque ligne → profil 360° ; sélection → export email ou action groupée autorisée | recherche nom/prénom/email/code/étudiant, filtres année/filière/niveau/statut adhésion/statut paiement/consentement/catégories email, colonnes configurables, export CSV |
| `/bureau/personnes/:personId`              | Profil membre 360° central                                   | toutes les entités appartenant à la personne                             | toutes les actions sensibles                                                      | en-tête fixe, onglets, timeline, actions rapides, droits par bouton                                                                                                      |
| `/bureau/personnes/:personId/adhesions`    | Historique d’adhésion                                        | `Dossier`, `Membership`                                                  | décision → statut membre                                                          | valider, refuser, demander correction, notes, historique                                                                                                                 |
| `/bureau/personnes/:personId/paiements`    | Historique financier de la personne                          | `Payment`, `Invoice`, `Order`, `EventRegistration`                       | paiement → facture et journal                                                     | confirmer, annuler, remboursement total/partiel, rattachement, motif                                                                                                     |
| `/bureau/personnes/:personId/commandes`    | Suivre les achats                                            | `Order`, `OrderLine`                                                     | commande → facture et retrait                                                     | état, référence HelloAsso, lignes, retrait, note                                                                                                                         |
| `/bureau/personnes/:personId/evenements`   | Suivre inscriptions et billets                               | `EventRegistration`, `Ticket`, `Payment`                                 | billet → check-in                                                                 | inscription, paiement, annulation, présence                                                                                                                              |
| `/bureau/personnes/:personId/factures`     | Voir et créer les factures                                   | `Invoice`, `Payment`                                                     | facture → paiement/remboursement                                                  | facture liée ou libre, lignes, notes, téléchargement PDF                                                                                                                 |
| `/bureau/personnes/:personId/messages`     | Historique de communication                                  | `ContactMessage`, historique e-mail                                      | message → réponse                                                                 | réponse, statut, archivage, modèle utilisé                                                                                                                               |
| `/bureau/demandes`                         | Traiter les entrées publiques                                | `Dossier`, `ContactMessage`                                              | dossier/message → membre 360°                                                     | onglets messages, adhésions, corrections, filtres, actions groupées sûres                                                                                                |
| `/bureau/evenements`                       | Piloter la programmation                                     | `Event`, `EventRegistration`, `Ticket`, `Payment`                        | événement → participants/check-ins                                                | création, édition, publication, dates, capacité, tarifs, liste d’attente, statistiques                                                                                   |
| `/bureau/evenements/:eventId/participants` | Gérer les inscrits                                           | inscriptions et billets                                                  | participant → membre 360°                                                         | recherche, paiement attendu, présence, annulation, export                                                                                                                |
| `/bureau/evenements/:eventId/checkins`     | Contrôler les entrées                                        | billets et historique de scan                                            | scan → journal                                                                    | scanner, recherche, bouton pointer, déjà utilisé, paiement non confirmé                                                                                                  |
| `/bureau/boutique`                         | Gérer le catalogue minimal HelloAsso                         | catalogue interne, URLs HelloAsso                                        | produit → commande importée                                                       | ajouter, modifier, supprimer, activer/désactiver, URL externe                                                                                                            |
| `/bureau/boutique/commandes`               | Saisir et suivre les ventes HelloAsso                        | `Order`, `OrderLine`, `Payment`                                          | commande → personne/facture                                                       | import manuel, référence, état préparation/retrait, remboursement                                                                                                        |
| `/bureau/factures`                         | Vue comptable générale                                       | `Invoice`, `Payment`, utilisateur facultatif                             | facture → membre ou paiement ; confirmation de paiement → facture automatique     | créer facture liée ou libre, lignes, notes, statut, PDF, recherche, avoir/remboursement, historique                                                                      |
| `/bureau/equipe`                           | Organiser le bureau                                          | `TeamMember`, `User`                                                     | carte → espace bureau et public                                                   | drag-and-drop de l’ordre d’affichage, plusieurs pôles sans hiérarchie, fonctions, photo                                                                                  |
| `/bureau/messages`                         | Suivre les demandes et réponses                              | `ContactMessage`, journal e-mail                                         | message → personne si e-mail reconnu                                              | filtres, statut, réponse, archivage, export                                                                                                                              |
| `/bureau/exports`                          | Télécharger des listings                                     | utilisateurs, adhésions, consentements, messages                         | aucun changement métier                                                           | CSV filtré, colonnes choisies, date et auteur de l’export                                                                                                                |
| `/bureau/parametres`                       | Régler les paramètres non sensibles                          | configuration serveur                                                    | audit                                                                             | configuration générale, année, URL HelloAsso, paramètres d’affichage                                                                                                     |

`/setup` ne doit pas être une seconde authentification locale avec un mot de passe dans le navigateur. Il doit être réservé à une session serveur autorisée ou supprimé de la navigation de production.

## 3. Profil membre 360°

### En-tête permanent

- photo réelle ou placeholder AE2V ;
- nom, e-mail explicite, filière, année ;
- code interne opaque, jamais un identifiant brut dans un QR ;
- statut d’adhésion et statut de cotisation ;
- rôle public et plusieurs pôles sans pôle principal/secondaire ;
- carte de membre et, si nécessaire, carte Bureau ;
- dernière activité et alertes.

### Données d’adhésion à afficher

La fiche ne doit pas seulement afficher un résumé `User`. Elle reprend toutes les informations du formulaire d’adhésion, avec leur source et leur date :

- identité : prénom, nom ;
- coordonnées : e-mail, téléphone ;
- scolarité : identifiant étudiant, filière/département, niveau, groupe ;
- adhésion : année universitaire, statut du dossier, date de soumission, date de décision, motif de refus ou de correction, statut et montant de cotisation ;
- participation : centres d’intérêt, volontariat, message de motivation ;
- consentements : traitement des données, droit à l’image, communication, date et version du consentement ;
- sécurité et liaison : `userId`, identifiant de dossier, code membre opaque, date de création, dernière activité ;
- historique des changements et opérateur ayant modifié l’information.

Chaque information a un état visible : renseignée, absente, à vérifier ou obsolète. Les champs sensibles sont modifiables séparément avec validation et audit, jamais par un formulaire global opaque.

### Actions rapides

Chaque bouton doit afficher son droit et son effet :

| Action                         | Confirmation                         | Trace obligatoire                                                 |
| ------------------------------ | ------------------------------------ | ----------------------------------------------------------------- |
| Valider/refuser une adhésion   | oui, avec motif en cas de refus      | auteur, date, ancien/nouveau statut                               |
| Confirmer un paiement          | oui                                  | source, référence, mode, auteur ; création automatique de facture |
| Annuler un paiement            | oui, motif                           | audit et date                                                     |
| Rembourser                     | oui, montant total ou partiel, motif | montant, auteur, paiement associé                                 |
| Créer une facture              | aperçu puis confirmation             | lignes, total en centimes, auteur                                 |
| Ajouter une commande HelloAsso | confirmation                         | référence, prix snapshot, auteur                                  |
| Pointer un billet              | confirmation courte                  | billet, événement, opérateur, heure                               |
| Envoyer un e-mail              | aperçu obligatoire                   | destinataire, objet, modèle, auteur                               |
| Modifier le profil             | validation des champs                | champs modifiés, auteur                                           |

Une action trouvée par recherche approximative ne doit jamais être exécutée sans confirmation de l’identité exacte.

## 4. Modèle de données partagé

```text
User / Person
├── Membership[]
├── Payment[]
├── Order[] ── OrderLine[]
├── EventRegistration[] ── Ticket[]
├── Invoice[]
├── ContactMessage[] par e-mail reconnu
└── TeamMember? pour un membre du Bureau

Event
├── EventRegistration[]
├── Ticket[]
└── Payment[]

Toutes les mutations → AuditLog
```

Règles :

- argent en centimes entiers ;
- total calculé côté serveur ;
- prix et nom copiés dans les lignes de commande ;
- adhésion unique par utilisateur et année ;
- billet opaque et à usage unique ;
- rôles de sécurité séparés des intitulés publics ;
- e-mail public Bureau stocké explicitement en `@ae2v.fr` ;
- aucune donnée privée chargée par un autre utilisateur ;
- aucune mutation sensible autorisée par le seul état React.

### Statuts de référence

Paiement : `EN_ATTENTE`, `CONFIRME`, `ANNULE`, `REMBOURSE`, `PARTIELLEMENT_REMBOURSE`.

Commande : `SAISIE`, `PAYEE`, `A_PREPARER`, `PRETE`, `REMIS`, `ANNULEE`, `REMBOURSEE`.

Adhésion : `BROUILLON`, `SOUMISE`, `A_CORRIGER`, `VALIDEE`, `REFUSEE`, `REVOQUEE`, `EXPIREE`.

Événement : `NON_PUBLIE`, `BIENTOT`, `OUVERT`, `COMPLET`, `TERMINE`.

### Règle universelle des éléments payants

Tout ce qui peut être payé — cotisation, inscription événement, commande HelloAsso ou facture libre — suit le même parcours :

```text
création → EN_ATTENTE → validation par la source ou un opérateur autorisé → CONFIRME
                                      ↓
                              facture créée automatiquement
                                      ↓
                         facture PDF + historique + audit
```

Le profil 360° et le scanner affichent les paiements en attente en premier. Un opérateur habilité peut confirmer, annuler ou rembourser depuis le profil ou depuis le résultat du scan, après vérification de l’identité. Une confirmation crée une facture idempotente liée au paiement ; un doublon est impossible. La facture permet téléchargement PDF simple, impression, correction contrôlée, avoir/remboursement total ou partiel et historique des états.

## 5. Recherche, scanner et QR

Le QR ou code présenté ne contient jamais un identifiant utilisateur brut. Il contient un code opaque signé ou aléatoire, vérifié côté serveur.

### Ordinateur

- champ unique nom/email/code/référence ;
- résultat approximatif par nom et e-mail ;
- regroupement Personnes, Billets, Commandes, Factures, Paiements ;
- affichage de la confiance de la correspondance ;
- clic obligatoire pour sélectionner la personne exacte.

### Scanner

- caméra avec permission explicite ;
- saisie manuelle toujours disponible ;
- bouton lampe si supporté ;
- résultat d’abord, action ensuite ;
- état billet : valide, déjà utilisé, annulé, paiement en attente, introuvable ;
- bouton Pointer uniquement si autorisé ;
- accès aux paiements et remboursements uniquement selon le rôle Finance/Président.

Un code membre peut ouvrir la fiche 360°. Un billet ouvre la fiche 360° avec l’événement préselectionné.

## 6. E-mail et exports

Il n’y a pas de newsletter à construire maintenant.

### Outil e-mail nécessaire

Un éditeur complexe type marketing n’est pas nécessaire dans la première version. Il faut :

- objet ;
- destinataires individuels ou liste filtrée ;
- réponse à une personne depuis sa fiche ;
- texte simple avec paragraphes, liens et mise en forme minimale ;
- modèles : adhésion validée, paiement reçu, commande prête, événement ;
- aperçu avant envoi ;
- confirmation du nombre et de la liste des destinataires ;
- journal d’envoi et erreurs ;
- téléchargement CSV des listings d’e-mails avec consentement et source.

Une mise en forme riche pourra être ajoutée après la fiabilisation des données.

### Préférences et listes de destinataires

Les listings sont des exports opérationnels, pas une newsletter. Les catégories sont explicites et modifiables depuis la fiche 360° : `ADHESION`, `EVENEMENTS`, `BOUTIQUE`, `BDE` et `INFORMATIONS_GENERALES`. Les messages strictement transactionnels liés à une action demandée ou à un paiement restent séparés des communications facultatives.

Depuis `/bureau/personnes`, le Bureau peut filtrer par catégorie activée, désinscription globale, consentement et statut membre, choisir les colonnes puis télécharger un CSV dédoublonné avec e-mail, nom, catégories et date de mise à jour. Depuis la fiche, il peut activer/désactiver une catégorie ou toutes les communications facultatives.

Chaque e-mail facultatif contient un lien direct signé et opaque, par exemple `/email/desinscription/:token`. Il désactive immédiatement les catégories facultatives après confirmation et propose ensuite la gestion depuis `/espace`. Un lien de préférences permet de ne désactiver qu’une catégorie. Le token ne contient jamais l’identifiant utilisateur brut et l’action est auditée.

## 7. Événements et statistiques

La gestion doit être simplifiée autour de trois écrans :

1. programmation : titre, date, lieu, statut, capacité, prix, publication ;
2. participants : inscrits, paiement, billet, annulation, recherche ;
3. check-in : scan, recherche, présence.

Statistiques utiles :

- inscrits / capacité / places restantes ;
- taux de remplissage ;
- répartition par tarif ;
- paiements en attente ;
- présents / absents ;
- annulations ;
- recette confirmée et recette attendue.

Il ne faut pas commencer par un tableau analytique complexe : ces indicateurs doivent être visibles en cartes et exportables.

## 8. Membres du Bureau

Les pôles opérationnels sont : Direction, Communication, Numérique, Finance, Événementiel et Partenarial. Direction est une gouvernance ; elle ne remplace pas les permissions techniques.

| Membre                 | Fonction publique                                             | Pôles associés            |
| ---------------------- | ------------------------------------------------------------- | ------------------------- |
| Hey’tham KORTAS        | Président                                                     | Direction · Partenarial   |
| Alexandre MARIETTE     | Vice-président                                                | Direction                 |
| Carla BARRUET          | Secrétaire                                                    | Direction                 |
| Jaden BRIVAL           | Trésorière                                                    | Finance · Direction       |
| Selma CHADLI           | Chargée de communication                                      | Communication             |
| Mathis LAPORTE KOUASSI | Chargé de communication                                       | Communication             |
| Yasmine LACHHEB        | Chargée de communication                                      | Communication             |
| Gaelle RASOLOMANANA    | Chargée de communication                                      | Communication             |
| Julline AZER           | Chargée de communication                                      | Communication             |
| Bastian NOËL           | Responsable de l’infrastructure numérique · Webmaster adjoint | Numérique · Communication |
| Loan JEAN              | Responsable Web & Discord                                     | Numérique · Communication |
| Franck MANICKAM        | **Chargé de l’événementiel**                                  | Événementiel              |
| Zohra SEKKAL           | Membre du bureau                                              | À définir                 |
| Matteo CAKARUN         | Membre du bureau                                              | À définir                 |

L’ordre d’affichage public est : Président, Vice-président, Secrétaire, Trésorière, responsables de pôles, autres membres. Le Bureau peut réordonner les cartes par glisser-déposer ; l’ordre est une donnée de présentation, pas une permission.

## 9. Cartes, photos et espace membre

### Carte publique équipe

Compacte : photo/placeholder, nom, fonction et pôles associés.

Étendue : photo, fonction, statut, pôles, mandat, biographie publique facultative et e-mail nominatif `@ae2v.fr` explicitement stocké.

### Carte dans `/espace`

- carte membre standard pour tous ;
- carte Bureau complémentaire pour un membre du Bureau ;
- fonction publique et pôles associés ;
- lien vers les coordonnées publiques ;
- aucune donnée privée de gestion.

### Placeholder

- rendu stable sans requête cassée ;
- initiales et couleur AE2V ;
- variante dirigeant/pôle facultative ;
- remplacement, suppression et validation de format dans le Bureau ;
- `alt` pertinent si photo réelle, décoratif si placeholder.

## 10. Permissions

| Rôle de sécurité | Lecture                                             | Écriture                                       |
| ---------------- | --------------------------------------------------- | ---------------------------------------------- |
| Membre           | ses propres données                                 | ses formulaires autorisés                      |
| Bureau           | demandes, personnes, événements selon délégation    | tâches opérationnelles non financières         |
| Trésorier        | tout ce qui concerne paiements, factures, commandes | confirmation, remboursement, facture           |
| Président        | toutes les opérations Bureau                        | toutes les opérations autorisées et paramètres |

Les intitulés « Président », « Chargée de communication », etc. sont publics et ne donnent aucun droit par eux-mêmes.

## 11. Endpoints serveur à maintenir et à compléter

Le projet utilise des server functions TanStack Start plutôt qu’une collection de routes REST publiques.

### Authentification

- `signInServer` : connexion et création de session HTTP ;
- `signUpServer` : création d’un utilisateur membre uniquement ;
- `getCurrentUserServer` : session courante ;
- `signOutServer` : suppression de session.

### Adhésion

- `submitMembershipServer` : validation et création du dossier ;
- `decideMembershipServer` : décision Bureau, création/liaison de `User` et `Membership`.

### Personne 360°

- `getBureauMembersServer` ;
- `getPerson360Server` ;
- `updatePaymentStatusServer` ;
- édition de profil administratif, préférences email, journal d’activité et actions de statut sont centralisés sur la fiche 360°.

### Paiements, commandes, factures

- `createInvoiceServer` ;
- `updateInvoiceServer` : lignes, statut, notes et contrôle d’un total déjà payé ;
- `getBureauBillingServer` ;
- `importHelloAssoOrderServer` ;
- `updateOrderServer` pour l’état de préparation et de retrait ;
- `refundOrderServer` ;
- confirmation idempotente de tout paiement, remboursement d’un paiement isolé, création automatique de facture, édition contrôlée, export comptable et PDF téléchargeable.

### Événements

- `getPublicEventsServer` ;
- `getBureauEventsServer` ;
- `getPublicEventServer` ;
- `saveEventServer` ;
- `registerEventServer` ;
- `getEventRegistrationsServer` ;
- `checkInTicketServer` ;
- `getEventStatsServer` et `cancelEventRegistrationServer` ; liste d’attente, statistiques agrégées, confirmation du paiement, annulation et check-in sont disponibles depuis la gestion des participants.

### Communication

- `submitContactMessageServer` ;
- `getContactMessagesServer` ;
- `updateContactMessageServer` ;
- préférences par catégorie, désinscription globale par token, contrôle serveur des destinataires, journal d’envoi et export CSV filtré par consentement ; aucun module newsletter n’est ajouté, et le transport SMTP reste une configuration d’infrastructure séparée.

### Préférences email

- `getEmailPreferencesServer` / `updateEmailPreferencesServer` : lecture et modification par le membre de ses catégories ;
- `unsubscribeEmailServer` : désinscription publique par token opaque ;
- `getBureauEmailListsServer` : listing filtré et export CSV côté Bureau ;
- toutes les fonctions d’envoi recalculent les destinataires côté serveur avant l’envoi.

### Équipe et catalogue

- `getTeamMembersServer`, `getPublicTeamMembersServer`, `saveTeamMemberServer`, `reorderTeamMembersServer`, `deleteTeamMemberServer` ;
- `getProductsServer`, `getBureauProductsServer`, `saveProductServer`, `deleteProductServer` ;
- le catalogue doit stocker une URL HelloAsso, un libellé, un prix indicatif, une image, un statut et des informations essentielles, sans devenir une caisse parallèle.

## 12. Étapes numérotées de mise en place

### Étape 1 — Geler l’architecture et les invariants

- valider ce document ;
- confirmer les routes conservées/supprimées ;
- confirmer les rôles et les pôles ;
- confirmer que `/actualites` et `/bde/poles` sont supprimées et retournent 404 ;
- confirmer que les visuels actuels restent la base.

**Livrable :** arborescence et règles validées.

### Étape 2 — Auditer et nettoyer le dépôt

- supprimer les références Actualités et `/bde/poles` restantes, y compris documentation, liens, menus et route générée ;
- repérer les tableaux locaux et les duplications de modèle ;
- inventorier chaque action actuelle du Bureau ;
- vérifier les routes générées et les aliases ;
- conserver uniquement les fallbacks locaux utiles à la démonstration.

**Livrable :** matrice route → source → action → permission.

### Étape 3 — Mettre le modèle PostgreSQL au même niveau que l’interface

- finaliser `User`, `Dossier`, `Membership`, `Payment`, `Order`, `OrderLine`, `Event`, `EventRegistration`, `Ticket`, `Invoice`, `ContactMessage`, `TeamMember`, `AuditLog` ;
- ajouter les préférences email par catégorie, la date de désinscription globale et un token de désinscription opaque pour les comptes `User` comme pour les dossiers `Dossier` non encore validés ;
- ajouter les contraintes d’idempotence paiement → facture et les champs d’audit nécessaires ;
- ajouter les index et contraintes d’unicité ;
- vérifier toutes les relations et les suppressions ;
- produire le diff Prisma et la migration versionnée `prisma/migrations/20260810170000_bureau_refonte/migration.sql` ;
- faire une sauvegarde ;
- appliquer la migration contrôlée en premier ou deuxième phase, jamais automatiquement au démarrage.

**Livrable :** schéma validé, migration réversible ou plan de restauration.

### Étape 4 — Sécuriser l’authentification et les permissions

- session HTTP sécurisée ;
- secret de production obligatoire ;
- rôle uniquement côté serveur ;
- création membre sans rôle privilégié ;
- tests membre, Bureau, Trésorier, Président, non connecté ;
- test d’accès à la fiche d’une autre personne.

**Livrable :** matrice d’autorisation testée.

### Étape 5 — Construire et fiabiliser la vue Personne 360°

- en-tête ;
- onglets ;
- timeline ;
- actions rapides ;
- confirmations et audits ;
- URLs profondes ;
- retour depuis recherche, scanner, commande, facture et événement.
- reprendre tous les champs du formulaire d’adhésion et tous les statuts dans une vue lisible ;
- ajouter les préférences email, l’activation/désactivation par catégorie et l’export des personnes éligibles.

**Livrable :** `/bureau/personnes/:personId` utilisable comme centre unique.

### Étape 6 — Connecter toutes les entrées publiques

- adhésion → dossier serveur ;
- contact → message serveur ;
- création de compte → utilisateur serveur ;
- événement → inscription, billet et paiement serveur ;
- boutique → HelloAsso et import de vente ;
- toutes les confirmations indiquent si le serveur a accepté ou si le mode démo est utilisé.

**Livrable :** aucune donnée publique importante ne reste uniquement dans le navigateur en production.

### Étape 7 — Connecter les listes et modules Bureau

- demandes et messages ;
- membres ;
- paiements ;
- factures ;
- commandes ;
- événements ;
- participants ;
- équipe ;
- catalogue HelloAsso ;
- exports.

**Livrable :** une modification effectuée dans une fiche est visible partout après revalidation serveur.

### Étape 8 — Finaliser l’espace `/espace`

- réorganiser les sections sans changer l’identité visuelle ;
- carte membre plus lisible ;
- carte Bureau pour les membres concernés ;
- paiements, billets, commandes, factures et historique ;
- états chargement, vide, erreur, expiré ;
- filtrage strict par session.

**Livrable :** membre et Bureau lisent la même donnée avec deux niveaux de visibilité.

### Étape 9 — Simplifier le BDE public

- conserver association et équipe ;
- supprimer la présentation publique inutile des pôles ;
- mettre les fonctions Président, Vice-président, Secrétaire et Trésorière en avant ;
- conserver les cartes de visite et placeholders ;
- vérifier mobile et dialogue accessible.

**Livrable :** `/bde` compris en quelques secondes, sans section redondante.

### Étape 10 — Finaliser paiements, factures et HelloAsso

- facture liée à un utilisateur ou libre ;
- lignes et totaux serveur ;
- PDF téléchargeable ;
- remboursement total/partiel avec motif ;
- commande HelloAsso avec snapshot des lignes ;
- suivi de retrait ;
- exports comptables ;
- aucune double caisse locale.
- confirmation possible depuis le profil et le scanner pour tout paiement en attente ;
- facture automatique dès confirmation, PDF simple téléchargeable et actions d’avoir/remboursement.

**Livrable :** historique financier vérifiable par personne et par période.

### Étape 11 — Finaliser événements et scanner

- statistiques essentielles ;
- participants ;
- recherche approximative sans action automatique ;
- check-in atomique ;
- billet déjà utilisé ;
- paiement non confirmé ;
- liste d’attente et annulation.

**Livrable :** un opérateur peut gérer une entrée en moins de trois actions sûres.

### Étape 12 — Finaliser communication et exports

- éditeur simple ;
- modèles ;
- aperçu ;
- envoi serveur ;
- journal ;
- CSV des personnes ayant consenti ;
- aucune newsletter ou abonnement automatique dans cette version.
- listes d’e-mails construites par filtres de préférences et consentements ;
- lien de désinscription présent dans chaque e-mail facultatif.

**Livrable :** communication opérationnelle sans créer un outil marketing disproportionné.

### Étape 13 — Recette complète

- happy path, chargement, vide et erreur de chaque page ;
- mobile, clavier, focus, Escape et réduction des animations ;
- rôle autorisé et rôle refusé ;
- accès croisé impossible ;
- paiements en centimes ;
- check-in concurrent ;
- photo absente ;
- membre avec plusieurs pôles ;
- export ;
- build, lint, TypeScript, console navigateur ;
- aperçu Vercel.

**Livrable :** rapport de recette et liste de corrections résiduelles.

### Étape 14 — Mise en production

- variables `POSTGRES_URL`, `SESSION_SECRET`, URL HelloAsso ;
- migration exécutée après sauvegarde ;
- seed uniquement contrôlé ;
- `/setup` protégé ou désactivé ;
- logs et audit vérifiés ;
- déploiement Vercel ;
- test post-déploiement des routes publiques et Bureau.

**Livrable :** site déployé et procédure de reprise documentée.

## 13. Critère de validation avant construction suivante

La prochaine refonte lourde ne doit commencer qu’après validation de :

1. l’arborescence et la suppression définitive des routes `/actualites` et `/bde/poles` ;
2. la suppression de la présentation publique des pôles ;
3. la fiche membre 360° comme centre de navigation, avec tous les champs du formulaire ;
4. la matrice des permissions et les préférences email ;
5. les statuts et relations de données ;
6. le paiement unifié et la facture automatique téléchargeable ;
7. le fait que la migration backend arrive en étape 3, donc dans la première ou deuxième phase technique ;
8. le périmètre limité de l’e-mail et de la boutique HelloAsso ;
9. le maintien de l’identité visuelle actuelle.
