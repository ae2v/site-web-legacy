import { GrainOverlay } from "@/components/brand";
import { Logo } from "@/components/brand/Logo";
import { QrCode } from "@/components/demo/qr-code";
import { cn } from "@/lib/utils";
import {
  contributionStatusLabels,
  membershipStatusLabels,
  type ContributionStatus,
  type MembershipStatus,
} from "@/lib/demo-session";

export type MemberCardData = {
  firstName: string;
  lastName: string;
  membershipStatus: MembershipStatus;
  contributionStatus: ContributionStatus;
  /** Formation / filière, ex. « MMI ». */
  departement: string;
  /** Année d'étude, ex. « 2e année ». */
  niveau: string;
  /** Année scolaire de l'adhésion, ex. « 2026-2027 ». */
  schoolYear: string;
  /** Date d'adhésion (null tant que le dossier n'est pas validé). */
  memberSince: string | null;
  /** Jeton opaque encodé dans le QR code (jamais un identifiant utilisateur). */
  cardCode: string;
};

/**
 * Carte de membre numérique AE2V.
 * Le même composant sert à la vraie carte (`size="full"`) et à l'aperçu de la
 * page Adhérer (`size="preview"`, données fictives) pour garantir un rendu
 * strictement identique.
 */
export function MemberCard({
  data,
  size = "full",
  preview = false,
  className,
}: {
  data: MemberCardData;
  size?: "full" | "preview";
  preview?: boolean;
  className?: string;
}) {
  const small = size === "preview";
  const valid = data.membershipStatus === "VALIDE";
  const qrSize = small ? 96 : 148;

  return (
    <div
      {...(preview ? { "aria-hidden": "true" as const } : {})}
      data-cursor-scheme="light"
      className={cn(
        "relative isolate overflow-hidden border-2 border-ae2v-black bg-ae2v-red text-ae2v-offwhite shadow-[8px_8px_0_0_var(--ae2v-black)]",
        small ? "w-full max-w-sm p-4" : "w-full max-w-xl p-5 sm:p-7",
        className,
      )}
    >
      <GrainOverlay opacity={0.12} />

      {/* Bande technique décorative, purement graphique. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-2 bg-ae2v-black/70"
      />

      <div className="relative flex items-start justify-between gap-3">
        <Logo
          variant="horizontal"
          tone="white"
          alt=""
          className={small ? "h-5 w-auto" : "h-7 w-auto"}
        />
        <span
          className={cn(
            "border-2 border-ae2v-offwhite/60 px-2 py-0.5 font-bold tracking-[0.16em] uppercase",
            small ? "text-[0.55rem]" : "text-[0.65rem]",
          )}
        >
          Carte membre · {data.schoolYear}
        </span>
      </div>

      <div
        className={cn(
          "relative mt-4 grid gap-4",
          small ? "grid-cols-[minmax(0,1fr)_auto]" : "sm:grid-cols-[minmax(0,1fr)_auto]",
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "ae2v-headline leading-[0.95] break-words",
              small ? "text-xl" : "text-[clamp(1.7rem,5vw,2.6rem)]",
            )}
          >
            {data.firstName} {data.lastName}
          </p>

          <dl
            className={cn(
              "mt-3 grid gap-x-4 gap-y-2",
              small ? "text-[0.7rem]" : "text-sm sm:grid-cols-2",
            )}
          >
            <Field
              small={small}
              label="Statut membre"
              value={valid ? "Membre" : membershipStatusLabels[data.membershipStatus]}
            />
            <Field
              small={small}
              label="Cotisation"
              value={contributionStatusLabels[data.contributionStatus]}
            />
            <Field small={small} label="Formation" value={data.departement} />
            <Field small={small} label="Année" value={data.niveau} />
            <Field small={small} label="Membre depuis" value={data.memberSince ?? "—"} />
          </dl>
        </div>

        {/* Zone QR : fond blanc dégagé de tout décor pour rester scannable. */}
        <div className="relative shrink-0 self-start bg-ae2v-offwhite p-2">
          <QrCode
            value={data.cardCode}
            size={qrSize}
            label={
              preview
                ? "Exemple de QR code de carte de membre"
                : `QR code de la carte de membre de ${data.firstName} ${data.lastName}`
            }
          />
          <p
            className={cn(
              "mt-1 max-w-[9rem] text-center font-mono break-all text-ae2v-black",
              small ? "text-[0.5rem]" : "text-[0.6rem]",
            )}
          >
            {data.cardCode}
          </p>
        </div>
      </div>

      <p
        className={cn(
          "relative mt-4 border-t-2 border-ae2v-offwhite/30 pt-3 font-bold tracking-[0.16em] uppercase",
          small ? "text-[0.5rem]" : "text-[0.6rem]",
        )}
      >
        AE2V · IUT de Vélizy · Carte nominative et non cessible
      </p>
    </div>
  );
}

function Field({ label, value, small }: { label: string; value: string; small: boolean }) {
  return (
    <div className="min-w-0">
      <dt
        className={cn(
          "font-bold tracking-[0.16em] uppercase opacity-75",
          small ? "text-[0.5rem]" : "text-[0.6rem]",
        )}
      >
        {label}
      </dt>
      <dd className="mt-0.5 font-bold break-words">{value}</dd>
    </div>
  );
}
