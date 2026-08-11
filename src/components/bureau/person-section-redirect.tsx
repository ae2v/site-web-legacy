import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export type PersonSection =
  "dossier-complet" | "paiements" | "commandes" | "evenements" | "factures" | "journal-membre";

export function PersonSectionRedirect({
  personId,
  section,
}: {
  personId: string;
  section: PersonSection;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({
      to: "/bureau/personnes/$personId",
      params: { personId },
      hash: section,
      replace: true,
    });
  }, [navigate, personId, section]);

  return (
    <main className="min-h-screen bg-ae2v-offwhite p-8" aria-busy="true">
      Ouverture de la fiche membre…
    </main>
  );
}
