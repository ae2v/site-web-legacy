# 04 — Les 10 règles d'ergonomie AE2V

Ces règles sont adaptées au projet à partir de principes reconnus de Nielsen Norman Group, WCAG 2.2, GOV.UK Design System et des recherches e-commerce de Baymard.

Elles doivent être appliquées à **chaque page, composant, parcours et prompt Lovable**.

---

# Règle 1 — Toujours montrer l'état du système

## Principe

Après une action, l'utilisateur doit savoir immédiatement :

- ce qui se passe ;
- si l'action a été prise en compte ;
- ce qu'il doit faire ensuite.

## AE2V

Exemples :

```text
Ajout au panier ✓
Paiement en cours…
Inscription confirmée ✓
Vous êtes 3e sur la liste d'attente
Commande prête à retirer
Billet déjà scanné à 19:42
```

## Application visuelle

- vert acide : succès / action confirmée / disponibilité ;
- rouge : erreur / action impossible ;
- noir : information neutre ;
- skeleton / spinner pour attente courte ;
- barre ou étape si processus plus long.

## À éviter

- bouton qui ne change pas après clic ;
- redirection silencieuse ;
- attente sans feedback ;
- paiement dont l'état est ambigu.

---

# Règle 2 — Parler le langage de l'étudiant, pas celui de la base

## Principe

L'interface suit le modèle mental de l'utilisateur.

## Bon

```text
Mes billets
Places restantes
Ma carte
Commande prête
Adhésion 2026–2027
```

## Mauvais

```text
event_registration
membership_status
order lifecycle
inventory adjustment
```

## Application

Les termes internes restent dans le code, jamais dans le copywriting public.

---

# Règle 3 — Une action principale dominante par contexte

## Principe

Chaque écran doit avoir une priorité claire.

## Exemple événement

Priorité :

```text
[ PRENDRE MA PLACE ]
```

Secondaire :

```text
Partager
Ajouter au calendrier
Voir le lieu
```

## Application graphique

Le CTA principal est souvent le meilleur endroit pour utiliser le **vert acide**.

Ne pas mettre 3 boutons verts côte à côte.

### Règle pratique

Dans une section donnée :

```text
1 CTA primaire maximum
1 à 2 actions secondaires
```

---

# Règle 4 — Reconnaissance plutôt que mémoire

## Principe

Ne pas obliger l'utilisateur à se souvenir d'informations affichées sur un écran précédent.

## AE2V

Toujours rappeler dans le checkout événement :

- titre de l'événement ;
- date ;
- tarif ;
- quantité ;
- total.

Dans le checkout boutique :

- produit ;
- variante ;
- quantité ;
- prix ;
- total.

Dans l'espace :

- prochain événement ;
- statut de commande ;
- adhésion active.

---

# Règle 5 — Cohérence stricte des composants et mots

## Principe

La même action doit toujours avoir :

- le même mot ;
- la même couleur ;
- le même comportement ;
- le même emplacement logique.

## Exemples

Toujours :

```text
Adhérer
Prendre ma place
Ajouter au panier
Annuler l'inscription
```

Ne pas alterner :

```text
Acheter / Commander / Valider / Continuer
```

si cela signifie exactement la même action.

## Design

Tous les boutons primaires suivent la même famille.

Tous les labels d'état suivent la même grammaire visuelle.

---

# Règle 6 — Prévenir les erreurs avant de les expliquer

## Principe

Le meilleur message d'erreur est celui qu'on évite.

## AE2V

### Événements

- désactiver une inscription fermée ;
- empêcher un double billet ;
- montrer le nombre de places ;
- confirmer une annulation.

### Boutique

- variante obligatoire avant ajout ;
- ne pas permettre une quantité > stock ;
- recalculer prix serveur.

### Bureau

- confirmation pour remboursement ;
- confirmation pour suppression ;
- avertissement avant révocation.

---

# Règle 7 — L'utilisateur doit pouvoir sortir, corriger et revenir

## Principe

Ne jamais créer de parcours piège.

## Application

- bouton retour ;
- bouton annuler ;
- panier modifiable ;
- formulaire qui conserve les valeurs ;
- possibilité de corriger avant paiement ;
- retour depuis Stripe sans perte de contexte ;
- action destructive réversible quand réaliste.

## Erreurs

Ne jamais vider les champs parce qu'une validation a échoué.

---

# Règle 8 — Mobile, toucher et formulaires doivent être simples

## Principe

Le site BDE sera massivement utilisé sur téléphone.

### Taille tactile

WCAG 2.2 fixe un minimum de 24×24 CSS px dans les conditions du critère 2.5.8.

**Standard interne AE2V recommandé : viser 44×44 px ou davantage pour les actions tactiles importantes.**

### Formulaires

- labels toujours visibles ;
- labels au-dessus des champs sur mobile ;
- pas de placeholder utilisé comme seul label ;
- bon `inputmode` / type de clavier ;
- auto-complete quand approprié ;
- une information importante par étape sur les parcours complexes ;
- réduire le nombre de champs.

### Checkout

Toujours montrer le total avant l'action finale.

---

# Règle 9 — Hiérarchie visuelle forte, sans surcharge cognitive

## Principe

Une interface peut être très expressive sans devenir confuse.

La charte AE2V autorise :

- gros titre ;
- cristaux ;
- texture ;
- rubans ;
- croix ;
- points ;
- obliques.

Mais les décorations doivent guider le regard.

## Hiérarchie recommandée

```text
1. TITRE / ÉTAT
2. INFORMATION ESSENTIELLE
3. CTA
4. CONTENU SECONDAIRE
5. DÉCOR
```

### Budget décoratif

2–3 familles de signes par section maximum en règle générale.

### Vert

Réserver aux points qui doivent réellement attirer l'œil.

---

# Règle 10 — Aider à récupérer d'une erreur et offrir l'aide au bon moment

## Principe

Une erreur doit dire :

1. ce qui s'est passé ;
2. où est le problème ;
3. comment le corriger.

## Bon

```text
Le paiement n'a pas été confirmé.
Aucun débit validé n'a été enregistré.
Réessayer le paiement.
```

```text
Choisissez une taille avant d'ajouter le sweat au panier.
```

## Mauvais

```text
Erreur 422
Invalid request
Une erreur est survenue
```

## Aide contextuelle

Préférer :

```text
Pourquoi demandons-nous ce numéro ?
```

près du champ concerné,

plutôt qu'une FAQ de 40 lignes séparée.

---

# Application par zone

## Homepage

- Règles 2, 3, 9.
- Gros titre très fort.
- Prochain événement visible.
- CTA vert unique.
- Décor autour, pas devant le contenu.

## Adhésion

- Règles 1, 4, 6, 7, 8, 10.
- Étapes courtes.
- Prix et année toujours visibles.
- progression claire.

## Événement

- Règles 1, 3, 4, 6.
- date + lieu + prix + disponibilité au-dessus de la ligne de flottaison mobile autant que possible.

## Boutique

- Règles 4, 6, 7, 8.
- total clair.
- panier éditable.
- erreurs de variante précises.

## Espace étudiant

- Règles 1, 2, 4.
- prioriser ce qui est urgent :
  - billet aujourd'hui ;
  - commande prête ;
  - adhésion expirante.

## Bureau

- Règles 1, 5, 7.
- dashboard orienté tâches.
- pas un musée de graphes.

## Scanner

- Règles 1, 3, 8.
- un écran, une tâche, un résultat massif et immédiat.

---

# Sources principales

- Nielsen Norman Group — 10 Usability Heuristics
  https://www.nngroup.com/articles/ten-usability-heuristics/
- WCAG 2.2
  https://www.w3.org/TR/WCAG22/
- GOV.UK Design System — Error messages
  https://design-system.service.gov.uk/components/error-message/
- GOV.UK — Labels and legends headings
  https://design-system.service.gov.uk/get-started/labels-legends-headings/
- Baymard — Mobile E-Commerce UX
  https://baymard.com/research/mcommerce-usability
- Baymard — Cart & Checkout
  https://baymard.com/research/checkout-usability
