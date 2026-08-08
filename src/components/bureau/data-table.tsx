import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  label: string;
  /** Valeur utilisée pour le tri (chaîne comparée en fr). */
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
};

const controlClass =
  "min-h-[44px] w-full border-2 border-ae2v-black/25 bg-ae2v-offwhite px-3 py-2 text-sm text-ae2v-black outline-none focus-visible:border-ae2v-red focus-visible:ring-2 focus-visible:ring-ae2v-red/40";

/**
 * Tableau de back-office : recherche, tri et filtres.
 * Rendu tableau sur grand écran, liste de cartes empilées sur mobile.
 */
export function DataTable<T extends { id: string }>({
  data,
  rows,
  columns,
  searchable,
  searchLabel = "Rechercher",
  searchPlaceholder = "Nom, e-mail, numéro…",
  filters,
  emptyLabel = "Aucun résultat.",
  caption = "Données du tableau",
  renderDetails,
  idPrefix = "table",
}: {
  data?: T[];
  rows?: T[];
  columns: Column<T>[];
  /** Texte concaténé dans lequel la recherche s'effectue. */
  searchable?: (row: T) => string;
  searchLabel?: string;
  searchPlaceholder?: string;
  filters?: ReactNode;
  emptyLabel?: string;
  caption?: string;
  /** Bloc d'actions/détails affiché sous chaque ligne. */
  renderDetails?: (row: T) => ReactNode;
  idPrefix?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [openRow, setOpenRow] = useState<string | null>(null);

  const safeRows = data ?? rows ?? [];

  const defaultSearchable = (row: T) =>
    Object.values(row ?? {})
      .filter((v) => typeof v === "string" || typeof v === "number")
      .join(" ");

  const getSearchText = searchable ?? defaultSearchable;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? safeRows.filter((r) => getSearchText(r).toLowerCase().includes(q))
      : safeRows.slice();
    const column = columns.find((c) => c.key === sortKey);
    if (column?.sortValue) {
      list = list.sort((a, b) => {
        const va = column.sortValue!(a);
        const vb = column.sortValue!(b);
        const cmp =
          typeof va === "number" && typeof vb === "number"
            ? va - vb
            : String(va).localeCompare(String(vb), "fr");
        return dir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [safeRows, query, sortKey, dir, columns, getSearchText]);

  function toggleSort(key: string) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("asc");
    }
  }

  return (
    <div>
      <div className="grid gap-3 border-2 border-ae2v-black bg-card p-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-end">
        <div>
          <label
            htmlFor={`${idPrefix}-search`}
            className="block text-[0.65rem] font-bold tracking-[0.16em] uppercase"
          >
            {searchLabel}
          </label>
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ae2v-black/50"
            />
            <input
              id={`${idPrefix}-search`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(controlClass, "pl-9")}
            />
          </div>
        </div>
        {filters ? <div className="flex flex-wrap items-end gap-3">{filters}</div> : null}
      </div>

      <p aria-live="polite" className="mt-3 text-xs font-bold tracking-[0.14em] uppercase">
        {visible.length} résultat{visible.length > 1 ? "s" : ""}
      </p>

      {visible.length === 0 ? (
        <p className="mt-3 border-2 border-dashed border-ae2v-black/40 p-6 text-sm">{emptyLabel}</p>
      ) : (
        <>
          {/* Vue tableau — écrans larges */}
          <div className="mt-3 hidden overflow-x-auto border-2 border-ae2v-black bg-card lg:block">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr className="bg-ae2v-black text-ae2v-offwhite">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={
                        sortKey === c.key
                          ? dir === "asc"
                            ? "ascending"
                            : "descending"
                          : c.sortValue
                            ? "none"
                            : undefined
                      }
                      className="px-3 py-2 text-left text-[0.65rem] font-bold tracking-[0.14em] uppercase"
                    >
                      {c.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 py-2 hover:text-ae2v-green"
                        >
                          {c.label}
                          {sortKey === c.key ? (
                            dir === "asc" ? (
                              <ArrowUp aria-hidden="true" className="size-3.5" />
                            ) : (
                              <ArrowDown aria-hidden="true" className="size-3.5" />
                            )
                          ) : (
                            <ArrowUpDown aria-hidden="true" className="size-3.5 opacity-60" />
                          )}
                          <span className="sr-only">
                            {sortKey === c.key && dir === "asc"
                              ? " (trié croissant, activer pour inverser)"
                              : " (activer pour trier)"}
                          </span>
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                  {renderDetails ? (
                    <th
                      scope="col"
                      className="px-3 py-2 text-right text-[0.65rem] font-bold tracking-[0.14em] uppercase"
                    >
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <RowGroup
                    key={row.id}
                    row={row}
                    columns={columns}
                    open={openRow === row.id}
                    onToggle={() => setOpenRow((r) => (r === row.id ? null : row.id))}
                    {...(renderDetails ? { renderDetails } : {})}
                    idPrefix={idPrefix}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Vue cartes — mobile / tablette */}
          <ul className="mt-3 space-y-3 lg:hidden">
            {visible.map((row) => (
              <li key={row.id} className="border-2 border-ae2v-black bg-card p-4">
                <dl className="grid gap-2 text-sm">
                  {columns.map((c) => (
                    <div key={c.key} className="flex flex-wrap justify-between gap-2">
                      <dt className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                        {c.label}
                      </dt>
                      <dd className="text-right">{c.render(row)}</dd>
                    </div>
                  ))}
                </dl>
                {renderDetails ? <div className="mt-4">{renderDetails(row)}</div> : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function RowGroup<T extends { id: string }>({
  row,
  columns,
  open,
  onToggle,
  renderDetails,
  idPrefix,
}: {
  row: T;
  columns: Column<T>[];
  open: boolean;
  onToggle: () => void;
  renderDetails?: (row: T) => ReactNode;
  idPrefix: string;
}) {
  return (
    <>
      <tr className="border-t-2 border-ae2v-black/15 align-top">
        {columns.map((c) => (
          <td key={c.key} className={cn("px-3 py-3", c.className)}>
            {c.render(row)}
          </td>
        ))}
        {renderDetails ? (
          <td className="px-3 py-3 text-right">
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              aria-controls={`${idPrefix}-details-${row.id}`}
              className="tap-44 border-2 border-ae2v-black px-3 text-xs font-bold uppercase hover:bg-ae2v-black hover:text-ae2v-offwhite"
            >
              {open ? "Fermer" : "Gérer"}
            </button>
          </td>
        ) : null}
      </tr>
      {renderDetails && open ? (
        <tr id={`${idPrefix}-details-${row.id}`} className="bg-ae2v-offwhite/60">
          <td colSpan={columns.length + 1} className="px-3 pt-1 pb-4">
            {renderDetails(row)}
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Filtre déroulant carré, réutilisé dans les tableaux du bureau. */
export function TableFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="min-w-[10rem]">
      <label htmlFor={id} className="block text-[0.65rem] font-bold tracking-[0.16em] uppercase">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlClass, "mt-2")}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Pastille de statut (texte + forme, jamais la couleur seule). */
export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "red" | "black";
}) {
  return (
    <span
      className={cn(
        "inline-block border-2 border-ae2v-black px-2 py-0.5 text-[0.7rem] font-bold uppercase",
        tone === "green"
          ? "bg-ae2v-green text-ae2v-black"
          : tone === "red"
            ? "bg-ae2v-red text-ae2v-offwhite"
            : tone === "black"
              ? "bg-ae2v-black text-ae2v-offwhite"
              : "bg-transparent",
      )}
    >
      {children}
    </span>
  );
}
