export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>La page n’a pas pu être chargée — AE2V</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #f4f1ec; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; border: 2px solid #111; background: #fff; box-shadow: 8px 8px 0 #111; }
      .eyebrow { color: #d5292f; font-weight: 800; letter-spacing: .2em; font-size: .75rem; }
      h1 { font-size: 1.75rem; text-transform: uppercase; margin: .75rem 0 .5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="eyebrow">AE2V</div>
      <h1>La page n’a pas pu être chargée</h1>
      <p>Une erreur temporaire est survenue. Réessayez ou revenez à l’accueil.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Réessayer</button>
        <a class="secondary" href="/">Retour à l’accueil</a>
      </div>
    </div>
  </body>
</html>`;
}
