import { ArrowUpRight, Facebook, Globe, Instagram, Mail, MessageCircle } from "lucide-react";

import { DotCloud, SectionHeading, TapeLabel } from "@/components/brand";
import { ae2vLinks, type Ae2vLink } from "@/data/links";
import { cn } from "@/lib/utils";

const icons = {
  discord: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  mail: Mail,
  globe: Globe,
} as const;

function LinkCardInner({ link }: { link: Ae2vLink }) {
  const Icon = icons[link.icon];
  return (
    <>
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center border-2 border-current"
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-impact text-2xl leading-none">{link.label}</span>
        <span className="mt-1 block text-sm break-all opacity-90">{link.detail}</span>
      </span>
      {link.href ? (
        <ArrowUpRight
          aria-hidden="true"
          className="size-6 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
        />
      ) : (
        <span className="shrink-0 border-2 border-current px-2 py-1 text-[0.65rem] font-bold tracking-[0.12em] uppercase">
          {link.status ?? "Bientôt"}
        </span>
      )}
    </>
  );
}

/**
 * Bloc « Nos liens » : cartes à bord dur, une par canal officiel.
 */
export function LinksSection({
  className,
  id,
  heading = "Nos liens",
  ghost = "LIENS",
}: {
  className?: string;
  id?: string;
  heading?: string;
  ghost?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby="ae2v-liens"
      className={cn("relative isolate overflow-hidden bg-background", className)}
    >
      <DotCloud className="absolute top-8 right-6 -z-10 text-ae2v-red/25" columns={8} rows={4} />

      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <TapeLabel tone="red">Rester connecté</TapeLabel>
        <SectionHeading as="h2" size="md" ghost={ghost} className="mt-5">
          <span id="ae2v-liens">{heading}</span>
        </SectionHeading>

        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {ae2vLinks.map((link) => (
            <li key={link.id}>
              {link.href ? (
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="tap-44 group flex w-full items-center gap-4 border-2 border-ae2v-black bg-card p-5 text-card-foreground transition-[transform,background-color,color] hover:-translate-y-1 hover:bg-ae2v-red hover:text-ae2v-offwhite"
                >
                  <LinkCardInner link={link} />
                  {link.external && <span className="sr-only">(nouvelle fenêtre)</span>}
                </a>
              ) : (
                <div className="flex w-full items-center gap-4 border-2 border-dashed border-ae2v-black/40 bg-muted p-5 text-muted-foreground">
                  <LinkCardInner link={link} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
