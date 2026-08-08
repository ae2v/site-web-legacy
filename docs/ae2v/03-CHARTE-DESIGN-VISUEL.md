# 03 — Charte web et direction visuelle AE2V

## 1. Intention

Le site doit donner l'impression d'une identité :

- étudiante ;
- énergique ;
- collective ;
- physique ;
- éditoriale ;
- sportive / dynamique sans devenir un site de sport ;
- urbaine / collage ;
- néo-brutaliste ;
- angulaire.

Le visuel n'est pas un ajout après l'UX : il fait partie de l'identité du produit.

---

# 2. Palette

## Couleurs principales

```css
--ae2v-red: #d60106;
--ae2v-red-dark: #aa0005;
--ae2v-black: #090908;
--ae2v-offwhite: #f3f1ec;
--ae2v-gray: #d6d6d6;
--ae2v-green: #bce707;
```

## Nuances

```css
--ae2v-red-light-1: #ef3039;
--ae2v-red-light-2: #e31820;
--ae2v-red-deep: #c00106;

--ae2v-green-light-1: #e6ff50;
--ae2v-green-light-2: #d1f32c;
--ae2v-green-dark-1: #a9cb06;
--ae2v-green-dark-2: #96af04;
```

## Hiérarchie chromatique

### Rouge

Couleur dominante.

Utiliser pour :

- grands aplats ;
- titres d'accent ;
- cristaux ;
- traits ;
- section emphasis ;
- état identitaire.

### Noir

Utiliser pour :

- grands titres ;
- blocs de contraste ;
- navigation ;
- traits ;
- texte très fort.

### Off-white

Fond principal clair.

Préférer le blanc cassé au blanc pur dans les grandes surfaces.

### Vert acide

Le vert doit être rare et immédiatement signifiant.

Utiliser pour :

- CTA prioritaire ;
- élément actif ;
- disponibilité / validation ;
- information à ne pas rater ;
- accent d'une campagne.

Ne pas faire du vert une deuxième couleur dominante.

---

# 3. Typographies

## Familles de la charte

```text
Albireo Extra Condensed Black
Anton
Bebas Neue Pro Expanded ExtraBold
Raleway Medium
Red Hat Display
Verdana fallback
```

## Web

```css
--font-impact: "Albireo Extra Condensed Black", Impact, Verdana, sans-serif;
--font-h1: "Anton", Impact, Verdana, sans-serif;
--font-h2: "Red Hat Display", Arial, Verdana, sans-serif;
--font-body: "Raleway", Verdana, Arial, sans-serif;
```

## Usage

### Display / Impact

Albireo :

- mots très courts ;
- numéros ;
- slogans ;
- titres de campagne ;
- texte XXL décoratif mais lisible.

### H1

Anton :

- titre principal d'une page ;
- annonces importantes.

### H2

Red Hat Display Bold pour le web.

### Corps

Raleway Medium.

---

# 4. Gros titres

Les gros titres sont une signature et doivent être structurants.

Exemples :

```text
TOUJOURS
PLUS LOIN,
ENSEMBLE.
```

```text
01.
ÉVÉNEMENTS
```

```text
PRENDS
TA PLACE.
```

### Règles

- 2 à 5 mots forts ;
- capitales lorsque pertinent ;
- lignes courtes ;
- contraste noir / rouge ;
- possibilité de souligner un mot avec un ruban ou une ligne ;
- pas de long paragraphe en typo impact.

### Échelle

La charte web reste la référence pour les titres courants.

Pour un display héroïque, autoriser un `clamp()` plus grand si :

- il ne casse pas le mobile ;
- il ne masque pas le CTA ;
- la hiérarchie sémantique reste propre.

---

# 5. Formes du langage graphique

## Cristaux / triangles

Signature principale.

- triangles irréguliers ;
- facettes ;
- variations d'une même teinte ;
- grands groupes coupés par le bord ;
- rouge prioritaire.

## Croix / repères

Petites croix techniques :

```text
+
⊕
×
```

À utiliser comme détails.

## Nuages / grilles de points

Exemple :

```text
• • • • •
• • • • •
• • • • •
```

Utiliser pour :

- combler un vide ;
- créer une tension graphique ;
- signaler une zone.

## Traits obliques

Exemple :

```text
///// ///// /////
```

Utiliser pour :

- séparateur ;
- bord de bloc ;
- micro-décor ;
- état actif.

## Coins / cadres

Utiliser des angles incomplets :

```text
┌           ┐

└           ┘
```

## Soulignements

Le soulignement AE2V peut être :

- trait rouge épais ;
- trait noir ;
- bande verte ;
- ruban texturé.

Il doit renforcer un mot, pas souligner tous les liens.

## Rubans / tapes

Formes papier légèrement irrégulières.

Utiliser pour :

- `NOUVEAU`
- `COMPLET`
- `INSCRIPTIONS`
- date ;
- promo ;
- micro-message prioritaire.

---

# 6. Géométrie

Le style doit être **dur et carré**.

## Radius

Règle interne recommandée :

```text
0 px  → grande majorité des blocs identitaires
4 px  → contrôles ou détails
8 px  → certains composants fonctionnels
12 px → maximum exceptionnel
```

Éviter :

```text
rounded-2xl
rounded-3xl
rounded-full
```

sauf besoin fonctionnel réel.

Les badges statut peuvent être rectangulaires ou légèrement arrondis, mais pas tous en pills.

---

# 7. Texture et grain

La texture doit donner un rendu :

- print ;
- papier ;
- roche ;
- affiche ;
- matière.

### Web

Intensité plus faible que dans le print.

Règle interne :

```text
grain global : 3–7 %
grain local / cristal : 8–15 %
```

Le grain ne doit pas :

- rendre le texte flou ;
- réduire le contraste ;
- augmenter excessivement le poids ;
- être appliqué au-dessus des formulaires.

---

# 8. Composition

## Principe

Créer un contraste entre :

```text
zone calme / vide
VS
zone dense / graphique
```

Ne pas répartir tous les éléments uniformément.

### Exemple

```text
┌──────────────────────────────────────────┐
│ TOUJOURS                   ▲ ▲           │
│ PLUS LOIN,               ▲   ▲    +      │
│ ENSEMBLE.                    ▲           │
│                                          │
│ [ CTA VERT ]                • • • •      │
│                             • • • •      │
└──────────────────────────────────────────┘
```

---

# 9. Budget décoratif

Pour préserver l'ergonomie :

**une section ne doit généralement pas utiliser plus de 2 à 3 familles de signes décoratifs simultanément.**

Exemple bon :

```text
cristaux + croix + ligne oblique
```

Exemple trop chargé :

```text
cristaux + croix + points + rubans + taches + flèches + bandes + 3 textures
```

---

# 10. Photos

Privilégier :

- vraies photos ;
- contraste élevé ;
- cadrage dynamique ;
- noir et blanc ou désaturation quand cela sert la composition ;
- superposition partielle de cristaux.

Ne jamais générer de faux membres de l'équipe.

---

# 11. Motion

Animations courtes :

- glissement léger ;
- apparition ;
- petite translation ;
- mouvement de cristal discret ;
- underline reveal.

Pas de décoration qui ralentit :

- checkout ;
- billet ;
- scanner ;
- login.

Respecter `prefers-reduced-motion`.

---

# 12. Interdit visuel explicite à Lovable

```text
NO glassmorphism
NO pastel gradients
NO purple/blue SaaS aesthetic
NO generic shadcn dashboard look
NO huge rounded cards
NO floating soft shadows everywhere
NO generic corporate illustrations
NO stock-photo feel
NO fake testimonials
NO visual uniformity with identical cards everywhere
```

# 13. TeamCard → carte de visite transformée

La liste de l'équipe doit faire partie des interactions signature du site.

## État compact

Chaque membre apparaît sous forme d'une carte dure / éditoriale :

```text
┌────────────────────────┐
│ [ PHOTO ]              │
│                        │
│ PRÉNOM NOM             │
│ PRÉSIDENT              │
│ DIRECTION              │
│                    ↗   │
└────────────────────────┘
```

Visuel :

- bord noir net ;
- fond off-white, rouge ou noir selon variante ;
- radius faible ;
- gros nom / poste ;
- petit repère `+`, croix ou coin graphique ;
- un détail rouge dominant ;
- vert acide uniquement si un statut réellement prioritaire doit être montré.

## Interaction de transformation

Au clic, au tap ou avec `Enter` / `Space` :

1. la carte sélectionnée devient l'élément actif ;
2. elle se détache visuellement de la grille ;
3. elle se déplace vers le centre de l'écran ;
4. elle s'agrandit ;
5. son contenu se réorganise progressivement ;
6. elle devient une **carte de visite AE2V** ;
7. l'arrière-plan est atténué ;
8. le focus clavier est placé dans la fiche.

L'effet doit ressembler à une transformation d'objet, pas à l'ouverture brutale d'une modale générique.

Une shared-element transition (`layoutId`, View Transitions API ou équivalent déjà disponible dans le stack) est préférable si elle reste stable.

Ne pas ajouter une grosse dépendance uniquement pour cette animation.

## Carte de visite développée

```text
┌──────────────────────────────────────────┐
│ AE2V                              +      │
│                                          │
│ [PHOTO]    PRÉNOM NOM                    │
│            PRÉSIDENT                     │
│            DIRECTION                     │
│                                          │
│            prenom.nom@ae2v.fr            │
│            Année 2026–2027               │
│                                          │
│  [ ÉCRIRE UN MAIL ]                 ↗    │
└──────────────────────────────────────────┘
```

Informations possibles :

- photo ;
- prénom + nom ;
- poste public / statut ;
- pôle ;
- année de mandat ;
- département si choisi pour l'affichage public ;
- bio très courte facultative ;
- adresse email professionnelle AE2V ;
- lien social professionnel/public facultatif.

## Email

Le composant n'affiche que l'adresse publique professionnelle prévue pour le membre.

Règle :

```text
*@ae2v.fr
```

Ne jamais afficher automatiquement une adresse personnelle.

Ne pas inventer `prenom.nom@ae2v.fr` si cette adresse n'existe pas réellement dans les données.

Prévoir un champ de donnée explicite :

```text
public_ae2v_email
```

Validation serveur / back-office :

- nullable ;
- si renseigné, doit appartenir au domaine `ae2v.fr` ;
- affiché uniquement si le membre est public.

## Accessibilité

Même si le rendu est une transformation animée, le comportement doit être celui d'un dialogue accessible :

- élément d'ouverture réellement focusable ;
- `aria-label` explicite ;
- focus déplacé vers la fiche ;
- `Escape` ferme ;
- bouton fermer visible ;
- clic/tap sur backdrop peut fermer si non destructif ;
- focus revient exactement sur la carte d'origine ;
- pas de focus derrière la fiche ;
- titre de fiche annoncé.

Éviter des liens imbriqués dans un `<button>`.
La carte compacte peut être un bouton d'ouverture ; les liens `mailto:` vivent uniquement dans la fiche développée.

## Mobile

Sur petit écran :

- la transformation peut finir en carte presque plein écran avec marges de 12–16 px ;
- aucune information ne sort de l'écran ;
- bouton fermer atteignable ;
- email ne force pas un overflow ;
- CTA tactile important ≥ objectif interne ~44 px.

## Reduced motion

Si `prefers-reduced-motion: reduce` :

- supprimer déplacement/scale/morph complexe ;
- utiliser apparition simple / fondu court ;
- conserver exactement la même fonction.

## Décoration

La fiche développée peut contenir :

- 1 petit cristal ;
- 1 grille de points OU quelques croix ;
- 1 soulignement/ruban ;
- grain léger.

Ne pas placer le grain sous l'adresse email au point de réduire sa lisibilité.
