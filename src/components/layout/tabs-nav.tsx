import { useId } from "react";

import { ScrollHintEdges } from "@/components/layout/scroll-hint-edges";
import { useScrollHint } from "@/hooks/use-scroll-hint";
import { cn } from "@/lib/utils";


export type TabItem = { id: string; label: string; badge?: number };

/**
 * Onglets AE2V (géométrie carrée, même langage visuel que la navigation du BDE).
 * Accessible : rôle tablist, navigation clavier flèches/Home/End, panneaux liés.
 */
export function TabsNav({
  tabs,
  active,
  onChange,
  label,
  idPrefix,
  tone = "dark",
  className,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  label: string;
  idPrefix: string;
  tone?: "dark" | "red";
  className?: string;
}) {
  const { ref: listRef, canLeft, canRight, scrollBy } = useScrollHint<HTMLDivElement>();

  function onKeyDown(event: React.KeyboardEvent) {
    const index = tabs.findIndex((t) => t.id === active);
    if (index < 0) return;
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    const target = tabs[next]!;
    onChange(target.id);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`#${idPrefix}-tab-${target.id}`)
        ?.focus();
    });
  }

  return (
    <div
      data-cursor-scheme="light"
      className={cn(
        "relative border-b-2 border-ae2v-black",
        tone === "red" ? "bg-ae2v-red" : "bg-ae2v-black",
        "text-ae2v-offwhite",
        className,
      )}
    >

      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="mx-auto flex w-full max-w-7xl snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain px-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] md:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                "tap-44 inline-flex shrink-0 snap-start items-center gap-2 px-3 text-[0.7rem] font-bold tracking-[0.1em] whitespace-nowrap uppercase transition-colors sm:px-4 sm:text-xs sm:tracking-[0.12em]",
                selected
                  ? tone === "red"
                    ? "bg-ae2v-black text-ae2v-offwhite"
                    : "bg-ae2v-red text-ae2v-offwhite"
                  : "hover:bg-ae2v-offwhite/10",
              )}
            >
              {tab.label}
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <span className="border-2 border-current px-1.5 text-[0.65rem]">{tab.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <ScrollHintEdges
        canLeft={canLeft}
        canRight={canRight}
        onScroll={scrollBy}
        fadeClass={tone === "red" ? "from-ae2v-red" : "from-ae2v-black"}
        buttonClass={
          tone === "red" ? "bg-ae2v-red text-ae2v-offwhite" : "bg-ae2v-black text-ae2v-offwhite"
        }
      />
    </div>

  );
}

/** Panneau associé à un onglet. */
export function TabPanel({
  id,
  idPrefix,
  active,
  children,
}: {
  id: string;
  idPrefix: string;
  active: string;
  children: React.ReactNode;
}) {
  const fallback = useId();
  if (id !== active) return null;
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      tabIndex={0}
      key={fallback}
      className="outline-none"
    >
      {children}
    </div>
  );
}
