# 14 — Checklist visuel + ergonomie

## A. Identité AE2V

- [ ] La page paraît AE2V sans dépendre uniquement du logo.
- [ ] Rouge utilisé comme couleur dominante.
- [ ] Noir/off-white structurent la composition.
- [ ] Vert acide uniquement sur élément réellement prioritaire.
- [ ] Un gros titre impactant structure la page.
- [ ] Typographies conformes / fallback propre.
- [ ] Géométrie carrée / dure.
- [ ] Pas de rounded cards génériques partout.
- [ ] Au moins un motif AE2V pertinent sur les pages éditoriales.
- [ ] Cristaux utilisés de façon intentionnelle.
- [ ] Nuage/grille de points possible mais non systématique.
- [ ] Croix / marqueurs secondaires.
- [ ] Trait oblique / bande possible.
- [ ] Soulignement/ruban utilisé pour accent, pas partout.
- [ ] Grain léger et non intrusif.
- [ ] Le décor n'entre pas dans les zones QR/formulaires.

## B. Hiérarchie

- [ ] L'utilisateur comprend la page en 5 secondes.
- [ ] Le titre principal est évident.
- [ ] L'information essentielle est proche du titre.
- [ ] Une action principale domine.
- [ ] Les actions secondaires ne concurrencent pas le CTA.
- [ ] La décoration arrive après contenu et action.

## C. Feedback

- [ ] Loading.
- [ ] Success.
- [ ] Error.
- [ ] Empty.
- [ ] Disabled expliqué si besoin.
- [ ] Progression si processus multi-étapes.

## D. Formulaires

- [ ] Label visible.
- [ ] Label au-dessus sur mobile.
- [ ] Placeholder non utilisé comme seul label.
- [ ] Autocomplete.
- [ ] Inputmode.
- [ ] Champs inutiles supprimés.
- [ ] Valeurs conservées après erreur.
- [ ] Message précis.
- [ ] Total visible avant paiement.

## E. Mobile

- [ ] 320 px.
- [ ] 375 px.
- [ ] Safe area.
- [ ] Pas de scroll horizontal.
- [ ] Important touch target ~44 px+.
- [ ] CTA facilement atteignable.
- [ ] Décor simplifié si nécessaire.

## F. Accessibilité

- [ ] Keyboard.
- [ ] Focus visible.
- [ ] Focus non masqué.
- [ ] Contraste.
- [ ] Reduced motion.
- [ ] Semantics.
- [ ] Alt.
- [ ] Status avec texte/icon, pas couleur seule.

## G. Sécurité UX

- [ ] Pas d'information privée exposée.
- [ ] Erreur ne fuite pas de détails internes.
- [ ] Action destructive confirmée.
- [ ] Pas de rôle admin basé sur bouton caché.

## H. Anti-SaaS check

Si au moins 3 réponses sont OUI, revoir le design :

- [ ] beaucoup de cards blanches arrondies identiques ?
- [ ] shadow-lg partout ?
- [ ] layout dashboard générique ?
- [ ] violet/bleu par défaut ?
- [ ] icônes génériques sans langage AE2V ?
- [ ] très peu de rouge ?
- [ ] aucun grand titre ?
- [ ] aucun signe graphique ?
- [ ] aucun contraste éditorial ?

## I. TeamCard / équipe

- [ ] Toute TeamCard compacte est focusable et compréhensible.
- [ ] Le clic/tap transforme visuellement la carte vers le centre.
- [ ] L'état développé ressemble à une carte de visite AE2V, pas une modale SaaS.
- [ ] Nom, rôle/statut et pôle sont visibles.
- [ ] `public_ae2v_email` est affiché uniquement s'il existe réellement.
- [ ] L'adresse finit par `@ae2v.fr`.
- [ ] Aucune adresse personnelle/auth n'est utilisée comme fallback.
- [ ] Escape ferme.
- [ ] Bouton fermer visible.
- [ ] Focus piégé correctement puis renvoyé à la carte source.
- [ ] Reduced motion fonctionne sans morph.
- [ ] Mobile ne déborde pas.
- [ ] Grain/décor n'empiète pas sur l'email ou les actions.
