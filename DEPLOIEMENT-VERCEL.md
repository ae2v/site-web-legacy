# Déploiement Vercel

Ce dépôt alimente deux projets distincts de l’équipe Vercel `ae2v` :

| Branche GitHub | Projet Vercel | Domaine de production |
| --- | --- | --- |
| `main` | `site-web-legacy` | `www.ae2v.fr` (`ae2v.fr` redirige vers `www`) |
| `demo` | `site-web-legacy-demo` | `demo.ae2v.fr` |

Chaque projet suit sa propre branche de production. Un push sur cette branche déclenche son déploiement automatique via l’intégration GitHub de Vercel. Les autres branches peuvent créer des aperçus, mais ne remplacent pas le domaine de production.

La démo utilise une base Neon distincte. Les variables d’environnement et les secrets sont configurés dans Vercel, jamais dans Git.
