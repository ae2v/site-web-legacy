import { useEffect } from "react";

export function BureauModuleRedirect({
  section,
  tab,
  eventId,
  contextKey,
  contextId,
}: {
  section: "scanner" | "personnes" | "gestion" | "demandes";
  tab?: string;
  eventId?: string;
  contextKey?: "eventId" | "invoiceId" | "orderId";
  contextId?: string;
}) {
  useEffect(() => {
    const id = eventId ?? contextId;
    const key = eventId ? "eventId" : contextKey;
    const search = new URLSearchParams();
    if (id && key) search.set(key, id);
    if (tab) search.set("tab", tab);
    const query = search.toString();
    if (id && key) {
      window.location.replace(`/bureau?${query}#${section}`);
      return;
    }
    window.location.replace(`/bureau${query ? `?${query}` : ""}#${section}`);
  }, [contextId, contextKey, eventId, section, tab]);
  return (
    <main className="min-h-screen bg-ae2v-offwhite p-8" aria-busy="true">
      Ouverture du module Bureau…
    </main>
  );
}
