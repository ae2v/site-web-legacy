import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { ScrollHintEdges } from "@/components/layout/scroll-hint-edges";
import { useScrollHint } from "@/hooks/use-scroll-hint";


export const Route = createFileRoute("/bde")({
  component: BdeLayout,
});

const bdeNav = [
  { to: "/bde", label: "Vue d'ensemble", exact: true },
  { to: "/bde/association", label: "L'association", exact: false },
  { to: "/bde/poles", label: "Les pôles", exact: false },
  { to: "/bde/equipe", label: "L'équipe", exact: false },
] as const;

function BdeLayout() {
  const { ref, canLeft, canRight, scrollBy } = useScrollHint<HTMLUListElement>();

  return (
    <>
      <nav
        aria-label="Sections du BDE"
        data-cursor-scheme="light"
        className="relative border-b-2 border-ae2v-black bg-ae2v-black text-ae2v-offwhite"
      >
        <ul
          ref={ref}
          className="mx-auto flex w-full max-w-7xl snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain px-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] md:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {bdeNav.map((item) => (
            <li key={item.to} className="shrink-0 snap-start">
              <Link
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{ className: "bg-ae2v-red text-ae2v-offwhite" }}
                className="tap-44 inline-flex items-center px-3 text-[0.7rem] font-bold tracking-[0.1em] whitespace-nowrap uppercase transition-colors hover:bg-ae2v-offwhite/10 sm:px-4 sm:text-xs sm:tracking-[0.12em]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <ScrollHintEdges
          canLeft={canLeft}
          canRight={canRight}
          onScroll={scrollBy}
          fadeClass="from-ae2v-black"
          buttonClass="bg-ae2v-black text-ae2v-offwhite"
        />
      </nav>


      {/* Les pages du BDE se rendent ici. */}
      <Outlet />
    </>
  );
}
