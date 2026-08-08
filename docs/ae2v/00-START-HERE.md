# AE2V — Pack V2 : produit, ergonomie, charte et prompts Lovable

## But

Ce pack est la source de vérité pour reconstruire le site AE2V comme une **plateforme de BDE complète**, en conservant une identité visuelle très forte issue de la charte graphique.

Le produit doit répondre à trois usages :

```text
PUBLIC                  ÉTUDIANT                  BUREAU
Découvrir               Participer                Gérer
↓                       ↓                         ↓
Événements              Carte adhérent            Adhérents
Adhérer                 Billets                   Événements
Boutique                Commandes                 Scanner
Avantages               Avantages                 Boutique
Le BDE                  Profil                    Contenu / partenaires
```

## Priorités non négociables

1. **La charte AE2V doit être immédiatement reconnaissable.**
2. **Le site ne doit pas ressembler à un dashboard SaaS générique.**
3. **Le rouge est la base visuelle ; le vert acide est un accent réservé aux actions et informations à faire ressortir.**
4. **La géométrie est dure, carrée, angulaire et éditoriale.**
5. **Les gros titres ont un rôle central.**
6. **Les cristaux, triangles, croix, nuages de points, traits obliques, cadres, soulignements et rubans sont des signes graphiques récurrents.**
7. **Le grain et les textures donnent un rendu imprimé / physique, mais ne doivent jamais dégrader la lisibilité.**
8. **L'ergonomie prime sur la décoration lorsqu'elles entrent en conflit.**
9. **Mobile-first : billet, QR, adhésion et scanner doivent être excellents sur téléphone.**
10. **Sécurité serveur réelle : jamais de permissions critiques basées uniquement sur le frontend.**

---

# Ordre de lecture

| Ordre | Fichier                              | Pourquoi                                     |
| ----- | ------------------------------------ | -------------------------------------------- |
| 1     | `01-VISION-ORGANISATION-PRODUIT.md`  | Comprendre le produit et les rôles           |
| 2     | `02-ARCHITECTURE-UX-SITEMAP.md`      | Comprendre l'arborescence et les parcours    |
| 3     | `03-CHARTE-DESIGN-VISUEL.md`         | Comprendre le langage visuel                 |
| 4     | `04-ERGONOMIE-10-REGLES.md`          | Les 10 règles UX à appliquer partout         |
| 5     | `05-PAGES-PARCOURS-COMPOSANTS.md`    | Traduction page par page                     |
| 6     | `06-DATA-SECURITY-BACKEND.md`        | Architecture métier et sécurité              |
| 7     | `07-BACKOFFICE-BUREAU.md`            | Organisation du bureau                       |
| 8     | `08-ROADMAP-TESTS-DOD.md`            | Ordre de développement et Definition of Done |
| 9     | `09-LOVABLE-PROJECT-KNOWLEDGE-V2.md` | À coller dans Project Knowledge              |
| 10    | `10-AGENTS.md`                       | Règles permanentes du repo                   |
| 11    | `11-LOVABLE-MASTER-PROMPT-V2.md`     | Prompt maître à lancer en Plan mode          |
| 12    | `12-LOVABLE-PROMPTS-ATOMIQUES-V2.md` | Prompts de construction étape par étape      |
| 13    | `13-LOVABLE-SKILL-UX-AUDIT.md`       | Skill optionnelle pour les audits UX         |
| 14    | `14-CHECKLIST-VISUEL-ERGONOMIE.md`   | Validation avant chaque livraison            |
| 15    | `15-SOURCES-RECHERCHE.md`            | Références utilisées                         |

---

# Workflow Lovable recommandé

```text
1. Ajouter Project Knowledge
2. Ajouter AGENTS.md
3. Fournir charte + legacy + specs
4. Passer en Plan mode
5. Lancer le Master Prompt
6. Valider l'architecture
7. Passer en Agent mode
8. Un seul bloc atomique à la fois
9. Vérifier mobile + rôles + erreurs + visuel
10. Commit GitHub
11. Revenir en Plan mode pour la phase suivante
```

## Règle de travail

Une phase ne doit jamais être considérée terminée parce que « le preview est joli ».

Elle est terminée lorsqu'elle est :

- utile ;
- compréhensible ;
- accessible ;
- cohérente avec la charte ;
- sûre ;
- testable ;
- stable ;
- responsive.

## Mise à jour V3 — Équipe et démarrage ZIP

Nouveautés :

- TeamCard interactive qui se transforme en carte de visite centrée ;
- adresse professionnelle `@ae2v.fr` uniquement si elle existe réellement ;
- comportement accessible type dialogue avec transformation visuelle ;
- prompt de bootstrap ZIP : `16-BOOTSTRAP-PROMPT-LOVABLE-ZIP.md`.

Pour démarrer un nouveau projet Lovable avec le ZIP, commencer par le fichier 16 avant le Master Prompt.
