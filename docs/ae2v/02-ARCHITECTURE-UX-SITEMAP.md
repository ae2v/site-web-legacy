# 02 — Architecture UX et sitemap

## 1. Sitemap public

```text
/
├── /evenements
│   ├── /evenements/:slug
│   └── /calendrier
├── /adherer
├── /boutique
│   ├── /boutique/:slug
│   ├── /panier
│   └── /commande/confirmation
├── /avantages
│   └── /avantages/:slug
├── /bde
│   ├── /bde/association
│   ├── /bde/equipe
│   ├── /bde/poles
│   └── /bde/rejoindre
├── /actualites
│   └── /actualites/:slug
├── /contact
├── /connexion
├── /inscription
├── /mentions-legales
├── /confidentialite
├── /conditions-vente
└── /remboursements
```

## 2. Espace étudiant

```text
/espace
├── /espace/carte
├── /espace/evenements
├── /espace/billets
├── /espace/commandes
├── /espace/avantages
└── /espace/profil
```

## 3. Bureau

```text
/bureau
├── /bureau/adherents
├── /bureau/equipe
├── /bureau/roles
├── /bureau/evenements
├── /bureau/participants
├── /bureau/scanner
├── /bureau/boutique
├── /bureau/commandes
├── /bureau/stocks
├── /bureau/partenaires
├── /bureau/contenu
├── /bureau/medias
├── /bureau/exports
├── /bureau/audit
└── /bureau/parametres
```

---

# 4. Architecture de la homepage

Ordre recommandé :

```text
01 Navbar
02 Hero
03 Prochain événement
04 Trois portes d'entrée
05 Adhésion
06 Événements à venir
07 Avantages / partenaires
08 Boutique
09 Le BDE / équipe
10 Réseaux / contact
11 Footer légal
```

## Hero

Le hero doit expliquer AE2V sans dépendre d'un long paragraphe.

Exemple :

```text
TOUJOURS
PLUS LOIN,
ENSEMBLE.

Le BDE de l'IUT de Vélizy

[ VOIR LES ÉVÉNEMENTS ]  [ DEVENIR ADHÉRENT ]
```

Le visuel est construit avec :

- très gros titre ;
- cristaux rouges ;
- lignes / repères ;
- petites croix ;
- nuage de points ;
- un accent vert acide autour du CTA prioritaire ;
- grain léger.

---

# 5. Parcours adhésion

```text
Découvrir l'offre
→ Se connecter / créer un compte
→ Vérifier les informations
→ Voir clairement prix + durée + avantages
→ Paiement
→ Confirmation serveur
→ Adhésion ACTIVE
→ Carte numérique + QR
```

### Ergonomie

- ne demander que les informations nécessaires ;
- ne jamais faire ressaisir une donnée déjà connue ;
- montrer le prix avant le paiement ;
- montrer l'année de validité ;
- sauvegarder la progression si possible ;
- permettre de revenir sans perdre les informations ;
- erreur spécifique au champ ;
- confirmation finale claire.

---

# 6. Parcours événement

```text
Voir événement
→ Comprendre date / lieu / prix / disponibilité
→ CTA unique
→ Auth si nécessaire
→ Tarif adapté
→ Paiement si nécessaire
→ Confirmation
→ Billet
→ QR
→ Scan
```

### Mobile

Le CTA d'inscription peut devenir un bandeau sticky bas si cela n'obstrue pas le contenu ni le focus.

Il doit afficher :

```text
4 € adhérent
[ PRENDRE MA PLACE ]
```

ou :

```text
COMPLET
[ REJOINDRE LA LISTE D'ATTENTE ]
```

---

# 7. Parcours boutique

```text
Catalogue
→ Produit
→ Variante
→ Ajouter
→ Panier
→ Checkout
→ Paiement
→ Préparation
→ Prête
→ Retrait
```

### Règles

- total visible ;
- panier éditable ;
- quantité modifiable sans écran supplémentaire ;
- variante visible dans le panier ;
- ne pas forcer la création de compte si la politique produit conserve l'achat invité ;
- expliquer clairement le retrait ;
- préserver les données en cas d'erreur.

---

# 8. Parcours scanner

Le scanner est un outil mono-tâche.

```text
SCANNER
↓
CAMÉRA
↓
RÉSULTAT IMMÉDIAT
```

États visuels :

```text
VERT ACIDE + ✓ : VALIDE
ROUGE + !      : DÉJÀ SCANNÉ / PROBLÈME
NOIR/GRIS      : INCONNU / HORS CONTEXTE
```

Important :
le vert acide est ici pertinent car l'état doit être compris instantanément.

---

# 9. Architecture de l'information

Toujours utiliser des mots étudiants / bureau, pas des termes de base de données.

Bon :

```text
Mes billets
Commande prête
Places restantes
Année 2026–2027
```

Mauvais :

```text
event_registration
order_status
membership entity
inventory movement
```
