# 01 — Vision et organisation produit AE2V

## 1. Vision

Le futur site AE2V doit être la **plateforme centrale de la vie étudiante du BDE**, et non une simple vitrine.

Sa structure mentale est :

> **Découvrir → Participer → Gérer**

### Public — Découvrir

Objectifs principaux :

- savoir ce qui arrive prochainement ;
- comprendre ce que fait le BDE ;
- adhérer ;
- acheter une place ;
- découvrir la boutique ;
- consulter les avantages ;
- connaître l'équipe et les contacts.

### Étudiant — Participer

Route :

```text
/espace
```

Objectifs :

- afficher sa carte ;
- afficher un QR ;
- retrouver ses billets ;
- suivre ses inscriptions ;
- retrouver ses commandes ;
- consulter ses avantages ;
- gérer son profil.

### Bureau — Gérer

Route :

```text
/bureau
```

Objectifs :

- piloter les adhésions ;
- organiser les événements ;
- gérer les participants ;
- scanner les billets ;
- gérer la boutique et le stock ;
- gérer les partenaires ;
- publier du contenu ;
- gérer les droits ;
- exporter les données utiles.

---

# 2. Navigation publique cible

```text
AE2V

ÉVÉNEMENTS
ADHÉRER
BOUTIQUE
AVANTAGES
LE BDE

                              [ MON ESPACE ]
```

Ne pas remettre `Membres` comme entrée principale.

L'équipe appartient à :

```text
LE BDE → L'ÉQUIPE
```

---

# 3. Jobs-to-be-done principaux

## Visiteur

- « Je veux savoir ce qui se passe bientôt. »
- « Je veux comprendre ce que j'obtiens si j'adhère. »
- « Je veux prendre ma place rapidement. »
- « Je veux savoir qui contacter. »

## Adhérent

- « Je veux montrer ma carte sans chercher. »
- « Je veux retrouver mon billet à l'entrée. »
- « Je veux savoir si ma commande est prête. »
- « Je veux utiliser mes avantages. »

## Bureau

- « Je veux voir ce qui nécessite mon attention aujourd'hui. »
- « Je veux créer un événement sans oublier les infos nécessaires. »
- « Je veux scanner une entrée sans accéder à tout le back-office. »
- « Je veux préparer les commandes efficacement. »
- « Je veux exporter une liste propre pour l'administration. »

---

# 4. Priorités produit

## P0 — indispensable

- design system AE2V ;
- site public ;
- auth ;
- année universitaire ;
- adhésion ;
- carte / QR ;
- événements ;
- inscription ;
- billetterie ;
- scanner ;
- panier multi-articles ;
- commandes ;
- rôle / RLS ;
- back-office opérationnel.

## P1 — très recommandé

- paiement ;
- emails transactionnels ;
- partenaires / avantages ;
- exports ;
- dashboard bureau ;
- médias ;

## P2 — après stabilisation

- galerie événement ;
- boîte à idées ;
- votes ;
- intégration Discord ;
- fidélité ;
- multi-BDE.

---

# 5. Principe d'année universitaire

L'année doit être un objet métier.

Exemple :

```text
2026–2027
```

Elle est utilisée pour :

- adhésions ;
- mandats d'équipe ;
- rôles temporaires ;
- statistiques ;
- archivage ;
- passation.

Ne jamais écraser les données de l'année précédente.

---

# 6. Séparation affichage / sécurité

Exemple :

```text
POSTE PUBLIC : Président
PERMISSION : admin
```

Ces deux notions sont indépendantes.

Une personne peut être affichée comme :

```text
Responsable communication
```

et avoir uniquement :

```text
scope = content
```

---

# 7. Principe de contenu

Ne jamais inventer en production :

- partenaire ;
- témoignage ;
- chiffre d'adhérents ;
- événement ;
- tarif ;
- avantage ;
- sponsor ;
- photo d'équipe.

Quand une donnée réelle manque :

```text
→ état vide explicite
→ aucun faux contenu décoratif
```
