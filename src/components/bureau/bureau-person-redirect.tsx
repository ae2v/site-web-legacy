import { useEffect } from "react";

/** Alias historique : toutes les anciennes fiches convergent vers la fiche 360°. */
export function BureauPersonRedirect({ personId }: { personId: string }) {
  useEffect(() => {
    window.location.replace(`/bureau/personnes/${encodeURIComponent(personId)}`);
  }, [personId]);

  return (
    <main className="min-h-screen bg-ae2v-offwhite p-8" aria-busy="true">
      Ouverture de la fiche adhérent…
    </main>
  );
}
