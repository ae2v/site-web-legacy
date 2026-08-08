import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { StatusPill } from "@/components/bureau/data-table";
import { Button } from "@/components/ui/button";
import {
  contributionStatusLabels,
  demoAccounts,
  formatCents,
  membershipStatusLabels,
  useDemoSession,
  type ContributionStatus,
  type Dossier,
  type DossierStatus,
} from "@/lib/demo-session";
import { cn } from "@/lib/utils";

const inputClass =
  "min-h-[44px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-base text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

export const membershipTone: Record<DossierStatus, "neutral" | "green" | "red" | "black"> = {
  EN_ATTENTE: "neutral",
  A_CORRIGER: "red",
  VALIDE: "green",
  REFUSE: "black",
};

export const contributionTone: Record<ContributionStatus, "neutral" | "green" | "red" | "black"> = {
  NON_COTISANT: "neutral",
  PAIEMENT_EN_ATTENTE: "red",
  COTISANT: "green",
};

export function today(): string {
  return new Date().toLocaleDateString("fr-FR");
}

/**
 * Fiche détaillée UNIQUE d'une demande ou d'un membre.
 * Structure : statut en tête, puis blocs identité / études / adhésion /
 * cotisation / préférences. Pour un membre validé, l'activité (commandes,
 * billets) est ajoutée en fin de fiche.
 */
export function DossierFiche({ dossier }: { dossier: Dossier }) {
  const { can, updateDossier } = useDemoSession();
  const [editing, setEditing] = useState(false);
  const account = demoAccounts.find((a) => a.email === dossier.email) ?? null;
  const validated = dossier.status === "VALIDE";

  return (
    <div className="space-y-8">
      {/* ------------------------------ Statut --------------------------- */}
      <section
        aria-labelledby="fiche-statut"
        className="border-2 border-ae2v-black bg-card p-5 md:p-6"
      >
        <h2 id="fiche-statut" className="text-xs font-bold tracking-[0.16em] uppercase">
          Statut du dossier
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatusPill tone={membershipTone[dossier.status]}>
            Adhésion : {membershipStatusLabels[dossier.status]}
          </StatusPill>
          <StatusPill tone={contributionTone[dossier.contributionStatus]}>
            Cotisation : {contributionStatusLabels[dossier.contributionStatus]}
          </StatusPill>
          <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
            {dossier.id}
          </span>
        </div>
        {dossier.note && (
          <p className="mt-3 border-l-4 border-ae2v-red pl-3 text-sm">
            <span className="font-bold">Note interne :</span> {dossier.note}
          </p>
        )}
      </section>

      {/* ------------------------------- Blocs --------------------------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Block title="Identité">
          <Field label="Prénom" value={dossier.firstName} />
          <Field label="Nom" value={dossier.lastName} />
          <Field label="E-mail" value={dossier.email} />
          <Field label="Téléphone" value={dossier.phone || "—"} />
        </Block>

        <Block title="Études">
          <Field label="Filière" value={dossier.departement} />
          <Field label="Année d'études" value={dossier.niveau} />
          <Field label="Numéro étudiant" value={dossier.studentId} />
        </Block>

        <Block title="Adhésion">
          <Field label="Statut" value={membershipStatusLabels[dossier.status]} />
          <Field label="Déposée le" value={dossier.submittedAt} />
          <Field label="Validée le" value={dossier.validatedAt ?? "—"} />
          <Field label="Membre depuis" value={dossier.memberSince ?? "—"} />
        </Block>

        <Block title="Cotisation">
          <Field label="Statut" value={contributionStatusLabels[dossier.contributionStatus]} />
          <Field
            label="Montant choisi"
            value={dossier.contributionCents > 0 ? formatCents(dossier.contributionCents) : "—"}
          />
          <Field
            label="Réductions"
            value={dossier.contributionStatus === "COTISANT" ? "Ouvertes" : "Fermées"}
          />
        </Block>

        <Block title="Préférences e-mail" className="lg:col-span-2">
          {dossier.emailPrefs && dossier.emailPrefs.length > 0 ? (
            <div className="sm:col-span-3">
              <ul className="flex flex-wrap gap-2">
                {dossier.emailPrefs.map((pref) => (
                  <li key={pref}>
                    <StatusPill>{pref}</StatusPill>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Field label="Thématiques acceptées" value="Aucune, ne pas envoyer d'e-mail" />
          )}
        </Block>
      </div>

      {/* ----------------------- Correction des données ------------------- */}
      {can("dossiers:edit") && (
        <section aria-labelledby="fiche-edit" className="border-2 border-ae2v-black bg-card p-5">
          <h2 id="fiche-edit" className="font-impact text-xl uppercase">
            Corriger les données
          </h2>
          {editing ? (
            <EditForm dossier={dossier} onDone={() => setEditing(false)} />
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                La modification des données saisies se fait uniquement ici, dans la fiche complète.
              </p>
              <Button className="mt-4" variant="black" onClick={() => setEditing(true)}>
                Modifier la fiche
              </Button>
            </>
          )}
        </section>
      )}

      {/* ------------------------------ Décisions ------------------------- */}
      <section aria-labelledby="fiche-actions" className="border-2 border-ae2v-black bg-card p-5">
        <h2 id="fiche-actions" className="font-impact text-xl uppercase">
          Décisions
        </h2>
        {can("dossiers:validate") ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                disabled={dossier.status === "VALIDE"}
                onClick={() =>
                  updateDossier(dossier.id, {
                    status: "VALIDE",
                    validatedAt: dossier.validatedAt ?? today(),
                    memberSince: dossier.memberSince ?? today(),
                  })
                }
              >
                Valider l'adhésion
              </Button>
              <Button
                variant="secondary"
                disabled={dossier.status === "A_CORRIGER"}
                onClick={() => updateDossier(dossier.id, { status: "A_CORRIGER" })}
              >
                Demander une correction
              </Button>
              <Button
                variant="secondary"
                disabled={dossier.status === "REFUSE"}
                onClick={() => updateDossier(dossier.id, { status: "REFUSE" })}
              >
                Refuser
              </Button>
            </div>

            <p className="mt-6 text-[0.65rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
              Statut de cotisation (indépendant de l'adhésion)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["NON_COTISANT", "PAIEMENT_EN_ATTENTE", "COTISANT"] as ContributionStatus[]).map(
                (cs) => (
                  <Button
                    key={cs}
                    size="sm"
                    variant={dossier.contributionStatus === cs ? "default" : "secondary"}
                    aria-pressed={dossier.contributionStatus === cs}
                    onClick={() => updateDossier(dossier.id, { contributionStatus: cs })}
                  >
                    {contributionStatusLabels[cs]}
                  </Button>
                ),
              )}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Lecture seule : la validation revient à un membre habilité du bureau.
          </p>
        )}
      </section>

      {/* ---------------------- Activité (membre validé) ------------------ */}
      {validated && (
        <section aria-labelledby="fiche-activite" className="border-2 border-ae2v-black bg-card p-5">
          <h2 id="fiche-activite" className="font-impact text-xl uppercase">
            Activité du membre
          </h2>

          <h3 className="mt-4 text-xs font-bold tracking-[0.16em] uppercase">Billets</h3>
          {account && account.tickets.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {account.tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-2 border-ae2v-black/15 px-3 py-2 text-sm"
                >
                  <span className="font-bold">{ticket.eventTitle}</span>
                  <span className="text-muted-foreground">{ticket.date}</span>
                  <StatusPill tone={ticket.status === "valide" ? "green" : "black"}>
                    {ticket.status === "valide" ? "Valide" : "Utilisé"}
                  </StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Aucun billet pour l'instant.</p>
          )}

          <h3 className="mt-6 text-xs font-bold tracking-[0.16em] uppercase">Commandes</h3>
          {account && account.orders.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {account.orders.map((order) => (
                <li key={order.id} className="border-2 border-ae2v-black/15 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{order.id}</span>
                    <span className="text-muted-foreground">{order.date}</span>
                    <StatusPill>{order.status}</StatusPill>
                  </div>
                  <ul className="mt-1 text-muted-foreground">
                    {order.lines.map((line) => (
                      <li key={`${order.id}-${line.name}-${line.variant}`}>
                        {line.qty} × {line.name} · {line.variant} · {formatCents(line.priceCents)}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Aucune commande pour l'instant.</p>
          )}

          <h3 className="mt-6 text-xs font-bold tracking-[0.16em] uppercase">Historique</h3>
          <ol className="mt-2 space-y-1 border-l-4 border-ae2v-red pl-4 text-sm">
            <li>Demande déposée le {dossier.submittedAt}</li>
            {dossier.validatedAt && <li>Adhésion validée le {dossier.validatedAt}</li>}
            {dossier.contributionStatus === "COTISANT" && (
              <li>Cotisation confirmée · {formatCents(dossier.contributionCents)}</li>
            )}
          </ol>

          <p className="mt-4 text-sm">
            Les inscriptions aux événements se gèrent depuis la{" "}
            <Link className="ae2v-link font-bold text-ae2v-red" to="/evenements">
              billetterie
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}

function EditForm({ dossier, onDone }: { dossier: Dossier; onDone: () => void }) {
  const { updateDossier } = useDemoSession();
  const [values, setValues] = useState({
    firstName: dossier.firstName,
    lastName: dossier.lastName,
    email: dossier.email,
    phone: dossier.phone,
    studentId: dossier.studentId,
    departement: dossier.departement,
    niveau: dossier.niveau,
    note: dossier.note,
  });

  const fields: { key: keyof typeof values; label: string; inputMode?: "numeric" | "tel" }[] = [
    { key: "firstName", label: "Prénom" },
    { key: "lastName", label: "Nom" },
    { key: "email", label: "E-mail" },
    { key: "phone", label: "Téléphone", inputMode: "tel" },
    { key: "studentId", label: "Numéro étudiant", inputMode: "numeric" },
    { key: "departement", label: "Filière" },
    { key: "niveau", label: "Année d'études" },
    { key: "note", label: "Note interne" },
  ];

  return (
    <form
      className="mt-4 grid gap-4 border-2 border-ae2v-black bg-ae2v-offwhite p-4 text-ae2v-black sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        updateDossier(dossier.id, {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          studentId: values.studentId.trim(),
          departement: values.departement.trim(),
          niveau: values.niveau.trim(),
          note: values.note.trim(),
        });
        onDone();
      }}
    >
      {fields.map((field) => (
        <div key={field.key}>
          <label
            htmlFor={`fiche-${field.key}`}
            className="block text-xs font-bold tracking-[0.14em] uppercase"
          >
            {field.label}
          </label>
          <input
            id={`fiche-${field.key}`}
            className={cn(inputClass, "mt-2")}
            {...(field.inputMode ? { inputMode: field.inputMode } : {})}
            value={values[field.key]}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" variant="black">
          Enregistrer les corrections
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function Block({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-2 border-ae2v-black bg-card p-5", className)}>
      <h2 className="font-impact text-xl uppercase">{title}</h2>
      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.65rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-bold break-words">{value}</dd>
    </div>
  );
}
