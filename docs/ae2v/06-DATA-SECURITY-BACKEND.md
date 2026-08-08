# 06 — Backend, données et sécurité

## 1. Stack cible

Respecter le stack natif du projet Lovable.

Pour un nouveau projet Lovable :

- React / TypeScript selon template ;
- Lovable Cloud ou Supabase ;
- PostgreSQL ;
- Auth ;
- Storage ;
- Edge / server functions ;
- RLS.

---

# 2. Tables métier minimales

```text
profiles
school_years
memberships
team_positions
role_assignments

events
event_price_tiers
event_registrations
tickets
checkins

products
product_variants
inventory_movements
carts
cart_items
orders
order_lines

payments

partners
benefits

articles
media
short_links

email_deliveries
audit_logs
```

---

# 3. Adhésion

```text
memberships
- id
- user_id
- school_year_id
- status
- amount_cents
- payment_id
- started_at
- expires_at
- revoked_at
- created_at
```

Contrainte :

```text
UNIQUE(user_id, school_year_id)
```

Statuts :

```text
PENDING
ACTIVE
EXPIRED
REVOKED
REFUNDED
```

---

# 4. Rôles

## Affichage

```text
team_positions
```

## Autorisation

```text
role_assignments
```

Exemples :

```text
admin
bureau
responsable_evenement
responsable_boutique
communication
scanner
membre
```

Ne jamais laisser un utilisateur s'assigner un rôle.

---

# 5. Événements

```text
events
event_price_tiers
event_registrations
tickets
checkins
```

Prévoir :

- fenêtre d'inscription ;
- capacité ;
- waitlist ;
- tarifs ;
- ticket ;
- check-in ;
- idempotence ;
- anti-overselling côté serveur.

---

# 6. Boutique

Le modèle doit être :

```text
Order
  ├── OrderLine
  ├── OrderLine
  └── OrderLine
```

et non :

```text
Order → Product unique
```

Stocker :

- prix en centimes ;
- snapshot nom / variante / prix dans la ligne ;
- mouvements de stock audités.

---

# 7. Paiements

Le navigateur ne décide jamais :

- du total final ;
- de l'activation d'une adhésion ;
- du statut paid ;
- de la quantité finale disponible.

Le serveur :

1. reçoit l'intention ;
2. recalcule ;
3. valide permissions ;
4. crée / confirme le paiement ;
5. met à jour le métier après confirmation fiable ;
6. journalise si nécessaire.

---

# 8. RLS

## Public

Peut lire :

- événements publiés ;
- produits actifs ;
- partenaires actifs ;
- avantages publics ;
- articles publiés ;
- équipe publique.

## User

Peut lire :

- son profil ;
- ses memberships ;
- ses registrations ;
- ses tickets ;
- ses commandes.

## Bureau

Accès selon rôle et scope.

## Scanner

Accès minimal :

- vérifier un ticket ;
- créer check-in.

---

# 9. QR

Ne jamais encoder :

```text
user_id
email
student_id
```

en clair comme mécanisme d'autorisation.

Utiliser :

- token opaque aléatoire ;
- token signé ;
- hash stocké selon stratégie.

---

# 10. Storage

Types :

- event posters ;
- product images ;
- team photos ;
- partner logos ;
- article covers.

Validation :

- MIME ;
- taille ;
- autorisation ;
- nom généré ;
- policy bucket.

---

# 11. Audit

Tracer :

- rôle ajouté ;
- rôle retiré ;
- adhésion révoquée ;
- remboursement ;
- suppression événement ;
- modification stock importante ;
- annulation commande ;
- correction check-in.

---

# 12. Sécurité UX

Ne pas révéler inutilement :

- pourquoi une personne n'a pas un rôle ;
- existence d'autres comptes ;
- IDs ;
- données sensibles.

Les erreurs doivent être utiles sans fuiter de détails internes.
