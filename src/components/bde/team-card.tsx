import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Mail, RotateCw, X } from "lucide-react";

import { CrossMarker, DotCloud, GrainOverlay, TapeLabel } from "@/components/brand";
import { Logo } from "@/components/brand/Logo";
import {
  displayedTeamTitles,
  initials,
  memberEmails,
  primaryEmail,
  type TeamMember,
} from "@/data/team";
import { cn } from "@/lib/utils";

function cardTitles(member: TeamMember): string[] {
  const titles = displayedTeamTitles(member);
  if (!member.officerRole) return titles;
  const officer = member.officerRole.trim().toLocaleLowerCase("fr-FR");
  return titles.filter((title) => title.trim().toLocaleLowerCase("fr-FR") !== officer);
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Portrait / repli graphique                                          */
/* ------------------------------------------------------------------ */

function Portrait({ member, className }: { member: TeamMember; className?: string }) {
  if (member.photoUrl) {
    return (
      <img
        src={member.photoUrl}
        alt={`Portrait de ${member.displayName}`}
        width={640}
        height={640}
        className={cn("object-cover", className)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-ae2v-black text-ae2v-offwhite",
        className,
      )}
    >
      <DotCloud className="absolute inset-2 text-ae2v-red/50" columns={6} rows={6} />
      <span className="relative font-impact text-3xl">{initials(member.displayName) || "AE"}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Recto / verso de la carte de visite (format 85 × 55 mm)             */
/* ------------------------------------------------------------------ */

function CardFront({
  member,
  titleId,
  compact,
}: {
  member: TeamMember;
  titleId?: string;
  compact?: boolean;
}) {
  return (
    <div className="relative flex h-full w-full overflow-hidden border-2 border-ae2v-black bg-ae2v-offwhite text-ae2v-black">
      <GrainOverlay opacity={0.05} />

      <div className="relative w-[38%] shrink-0 overflow-hidden border-r-2 border-ae2v-black bg-ae2v-black">
        <Portrait member={member} className="h-full w-full" />
        <span
          aria-hidden="true"
          className="ae2v-stripes absolute inset-x-0 bottom-0 h-1.5 text-ae2v-red"
        />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col justify-between p-[5%]">
        <div className="flex items-start justify-between gap-2">
          <Logo
            variant="emblem"
            tone="red"
            alt=""
            className={cn("w-auto", compact ? "h-5" : "h-8")}
          />
          <CrossMarker className="text-ae2v-red" size={compact ? 12 : 16} />
        </div>

        <div className="min-w-0">
          {titleId ? (
            <h2
              id={titleId}
              className="font-impact leading-[0.95] break-words text-[clamp(1.4rem,4.2cqw,2.6rem)]"
            >
              {member.displayName}
            </h2>
          ) : (
            <p className="font-impact leading-[0.95] break-words text-[clamp(0.95rem,5.2cqw,1.6rem)]">
              {member.displayName}
            </p>
          )}
          <p
            className={cn(
              "mt-1 font-bold tracking-[0.08em] uppercase text-ae2v-red",
              compact ? "text-[0.62rem]" : "text-sm",
            )}
          >
            {(member.officerRole ? `${member.officerRole} · ` : "") +
              (cardTitles(member).join(" · ") || "Membre du bureau")}
          </p>
          <p
            className={cn(
              "mt-0.5 tracking-[0.14em] uppercase text-ae2v-black/60",
              compact ? "text-[0.55rem]" : "text-xs",
            )}
          >
            Pôles : {member.poles.join(" · ") || "À définir"}
          </p>
        </div>

        <div
          className={cn(
            "flex items-end justify-between gap-2 tracking-[0.14em] uppercase text-ae2v-black/60",
            compact ? "text-[0.5rem]" : "text-[0.65rem]",
          )}
        >
          <span>Mandat {member.mandate}</span>
          <span className="font-bold text-ae2v-black">AE2V</span>
        </div>
      </div>
    </div>
  );
}

function CardBack({ member }: { member: TeamMember }) {
  const { role, personal, any } = memberEmails(member);

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden border-2 border-ae2v-black bg-ae2v-black p-[4%] text-ae2v-offwhite">
      <GrainOverlay opacity={0.08} />
      <DotCloud className="absolute -right-2 -bottom-2 text-ae2v-red/40" columns={8} rows={5} />

      <div className="relative flex items-start justify-between gap-3">
        <Logo variant="horizontal" tone="white" alt="" className="h-6 w-auto md:h-7" />
        <span className="text-[0.6rem] tracking-[0.16em] uppercase text-ae2v-offwhite/70">
          Verso
        </span>
      </div>

      <dl className="relative grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[0.6rem] tracking-[0.16em] uppercase text-ae2v-offwhite/60">
            {member.isOfficer ? "Statut" : "Rôle"}
          </dt>
          <dd className="font-bold">
            {member.officerRole ? `${member.officerRole} · ` : ""}
            {cardTitles(member).join(" · ") || "Membre du bureau"}
          </dd>
        </div>
        <div>
          <dt className="text-[0.6rem] tracking-[0.16em] uppercase text-ae2v-offwhite/60">Pôle</dt>
          <dd className="font-bold">{member.poles.join(" · ") || "À définir"}</dd>
        </div>
        {role && (
          <div>
            <dt className="text-[0.6rem] tracking-[0.16em] uppercase text-ae2v-offwhite/60">
              Email de fonction
            </dt>
            <dd className="font-bold break-all">
              <a href={`mailto:${role}`} className="ae2v-link text-ae2v-green">
                {role}
              </a>
            </dd>
          </div>
        )}
        {personal && (
          <div>
            <dt className="text-[0.6rem] tracking-[0.16em] uppercase text-ae2v-offwhite/60">
              Email nominatif
            </dt>
            <dd className="font-bold break-all">
              <a href={`mailto:${personal}`} className="ae2v-link text-ae2v-green">
                {personal}
              </a>
            </dd>
          </div>
        )}
        {!any && (
          <div className="sm:col-span-2">
            <dt className="text-[0.6rem] tracking-[0.16em] uppercase text-ae2v-offwhite/60">
              Email AE2V
            </dt>
            <dd className="font-bold text-ae2v-offwhite/60">Non communiqué</dd>
          </div>
        )}
      </dl>

      {member.bio && (
        <p className="relative max-w-prose text-xs text-ae2v-offwhite/75 md:text-sm">
          {member.bio}
        </p>
      )}

      <span aria-hidden="true" className="ae2v-stripes relative block h-2 text-ae2v-red" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carte compacte (déclencheur)                                        */
/* ------------------------------------------------------------------ */

function CompactCard({
  member,
  onOpen,
  buttonRef,
  hidden,
}: {
  member: TeamMember;
  onOpen: (rect: DOMRect) => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
  hidden: boolean;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      aria-haspopup="dialog"
      aria-label={`Ouvrir la carte de visite de ${member.displayName}, ${member.roleTitle}`}
      onClick={(event) => onOpen(event.currentTarget.getBoundingClientRect())}
      style={{ containerType: "inline-size" }}
      className={cn(
        "group relative block aspect-[85/55] w-full text-left",
        "transition-[transform,box-shadow,opacity] duration-200 ease-out",
        "shadow-[6px_6px_0_var(--ae2v-black)] hover:-translate-y-1.5 hover:rotate-[-0.6deg]",
        "hover:shadow-[12px_12px_0_var(--ae2v-red)] focus-visible:-translate-y-1.5",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:rotate-0",
        hidden && "pointer-events-none opacity-0",
      )}
    >
      <CardFront member={member} compact />
      <span className="sr-only">Voir la carte de visite</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Carte de visite développée (dialogue)                               */
/* ------------------------------------------------------------------ */

function BusinessCardDialog({
  member,
  originRect,
  onClose,
}: {
  member: TeamMember;
  originRect: DOMRect | null;
  onClose: () => void;
}) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [closing, setClosing] = useState(false);
  const titleId = `team-card-${member.id}`;

  /** Transformation « objet » : la carte se décolle réellement de la vignette. */
  const flipAnimation = useCallback(
    (direction: "in" | "out") => {
      const node = sceneRef.current;
      if (!node || !originRect || prefersReducedMotion()) return null;

      const target = node.getBoundingClientRect();
      const dx = originRect.left + originRect.width / 2 - (target.left + target.width / 2);
      const dy = originRect.top + originRect.height / 2 - (target.top + target.height / 2);
      const scale = Math.max(originRect.width / target.width, 0.15);

      const from: Keyframe = {
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale}) rotateX(0deg) rotateZ(0deg)`,
        filter: "drop-shadow(0 0 0 rgba(9,9,8,0))",
        offset: 0,
      };
      const lift: Keyframe = {
        transform: `translate3d(${dx * 0.45}px, ${dy * 0.45 - 26}px, 0) scale(${
          scale + (1 - scale) * 0.55
        }) rotateX(14deg) rotateZ(-3deg)`,
        filter: "drop-shadow(0 26px 26px rgba(9,9,8,0.45))",
        offset: 0.55,
      };
      const to: Keyframe = {
        transform: "translate3d(0, 0, 0) scale(1) rotateX(0deg) rotateZ(0deg)",
        filter: "drop-shadow(0 18px 30px rgba(9,9,8,0.35))",
        offset: 1,
      };

      // Les offsets doivent rester croissants : on les réattribue pour la sortie.
      const frames =
        direction === "in"
          ? [from, lift, to]
          : [
              { ...to, offset: 0 },
              { ...lift, offset: 0.45 },
              { ...from, offset: 1 },
            ];

      try {
        return node.animate(frames, {
          duration: direction === "in" ? 620 : 420,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        });
      } catch {
        // Animation impossible : on ne bloque jamais l'ouverture/fermeture.
        return null;
      }
    },
    [originRect],
  );

  useLayoutEffect(() => {
    flipAnimation("in");
    if (!prefersReducedMotion()) {
      overlayRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 260,
        easing: "ease-out",
      });
    }
  }, [flipAnimation]);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    const animation = flipAnimation("out");
    overlayRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 320,
      easing: "ease-in",
      fill: "forwards",
    });
    if (!animation) {
      onClose();
      return;
    }
    // Filet de sécurité : la fermeture aboutit même si l'événement n'arrive pas.
    const fallback = window.setTimeout(onClose, 500);
    animation.addEventListener(
      "finish",
      () => {
        window.clearTimeout(fallback);
        onClose();
      },
      { once: true },
    );
  }, [closing, flipAnimation, onClose]);

  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const list = Array.from(focusables).filter(
        (el) => el.offsetParent !== null || el === closeRef.current,
      );
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
    };
  }, [requestClose]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-3 md:p-6">
      <div
        ref={overlayRef}
        aria-hidden="true"
        onClick={requestClose}
        className="absolute inset-0 bg-ae2v-black/80 backdrop-blur-[2px]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-[680px]"
      >
        {member.isDemo && (
          <div className="mb-3">
            <TapeLabel tone="black">Fiche de démonstration</TapeLabel>
          </div>
        )}

        {/* Scène 3D : la carte se décolle puis se retourne comme un objet. */}
        <div
          ref={sceneRef}
          style={{ perspective: "1400px", containerType: "inline-size" }}
          className="w-full will-change-transform"
        >
          <div
            className={cn(
              "relative aspect-[85/55] w-full transition-transform duration-700 [transform-style:preserve-3d]",
              "motion-reduce:transition-none",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            <div className="absolute inset-0 [backface-visibility:hidden]">
              <CardFront member={member} titleId={titleId} />
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <CardBack member={member} />
            </div>
          </div>
        </div>

        {/* Commandes hors carte : jamais masquées par le retournement. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            ref={closeRef}
            onClick={requestClose}
            className="tap-44 inline-flex items-center gap-2 border-2 border-ae2v-offwhite bg-ae2v-offwhite px-4 text-xs font-bold tracking-[0.14em] uppercase text-ae2v-black transition-transform hover:-translate-y-0.5"
          >
            <X aria-hidden="true" className="size-4" />
            Fermer
          </button>

          <button
            type="button"
            aria-pressed={flipped}
            onClick={() => setFlipped((value) => !value)}
            className="tap-44 inline-flex items-center gap-2 border-2 border-ae2v-green bg-ae2v-green px-4 text-xs font-bold tracking-[0.14em] uppercase text-ae2v-black transition-transform hover:-translate-y-0.5"
          >
            <RotateCw aria-hidden="true" className="size-4" />
            {flipped ? "Voir le recto" : "Retourner la carte"}
          </button>

          {primaryEmail(member) && (
            <a
              href={`mailto:${primaryEmail(member)}`}
              className="tap-44 inline-flex items-center gap-2 border-2 border-ae2v-offwhite px-4 text-xs font-bold tracking-[0.14em] uppercase text-ae2v-offwhite transition-colors hover:bg-ae2v-offwhite hover:text-ae2v-black"
            >
              <Mail aria-hidden="true" className="size-4" />
              Écrire un mail
            </a>
          )}
        </div>

        {/* Contenu du verso restitué au lecteur d'écran sans dépendre du 3D. */}
        <p className="sr-only">
          {member.officerRole ? `${member.officerRole}, ` : ""}
          {displayedTeamTitles(member).join(", ") || "Membre du bureau"}, pôles{" "}
          {member.poles.join(", ") || "à définir"}, mandat {member.mandate}.
          {memberEmails(member).role ? ` Email de fonction : ${memberEmails(member).role}.` : ""}
          {memberEmails(member).personal
            ? ` Email nominatif : ${memberEmails(member).personal}.`
            : ""}
          {memberEmails(member).any ? "" : " Email AE2V non communiqué."}
          {member.bio ? ` ${member.bio}` : ""}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grille                                                              */
/* ------------------------------------------------------------------ */

export function TeamGrid({ members }: { members: TeamMember[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement | null>());

  const close = useCallback(() => {
    const id = openId;
    setOpenId(null);
    setOriginRect(null);
    requestAnimationFrame(() => {
      if (id) triggers.current.get(id)?.focus();
    });
  }, [openId]);

  const active = members.find((member) => member.id === openId) ?? null;

  if (members.length === 0) {
    return (
      <div className="border-2 border-ae2v-black bg-card p-8">
        <h2 className="font-impact text-2xl">Équipe en cours de publication</h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Les membres apparaîtront ici dès qu'ils seront publiés depuis le bureau.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <li key={member.id}>
            <CompactCard
              member={member}
              hidden={openId === member.id}
              buttonRef={(node) => {
                triggers.current.set(member.id, node);
              }}
              onOpen={(rect) => {
                setOriginRect(rect);
                setOpenId(member.id);
              }}
            />
          </li>
        ))}
      </ul>

      {active && <BusinessCardDialog member={active} originRect={originRect} onClose={close} />}
    </>
  );
}

export default TeamGrid;
