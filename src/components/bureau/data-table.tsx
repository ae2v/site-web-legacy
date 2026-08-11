import { isValidElement, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  label?: string;
  /** Alias conservé pour les tableaux historiques du bureau. */
  header?: string;
  /** Valeur utilisée pour le tri (chaîne comparée en fr). */
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
};

function fallbackSortValue<T>(row: T, key: string): string | number {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === "number" || typeof value === "string" ? value : String(value ?? "");
}

/**
 * Les colonnes du bureau sont souvent des colonnes calculées (ex. « Nom »,
 * « Formation » ou un statut rendu dans une pastille) : leur clé n'existe donc
 * pas littéralement dans l'objet de données. On extrait le texte réellement
 * affiché afin que chaque en-tête reste triable, même sans `sortValue` dédié.
 */
function renderedText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(renderedText).join(" ");
  if (isValidElement(node)) {
    const props = (node as ReactElement<{ children?: ReactNode }>).props;
    return renderedText(props.children);
  }
  return "";
}

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
  onRowClick,
  idPrefix = "table",
  allowColumnSelection = false,
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
  /** Ouvre une fiche/modal quand la ligne elle-même est activée. */
  onRowClick?: (row: T) => void;
  idPrefix?: string;
  allowColumnSelection?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const safeRows = useMemo(() => data ?? rows ?? [], [data, rows]);

  const defaultSearchable = (row: T) =>
    Object.values(row ?? {})
      .filter((v) => typeof v === "string" || typeof v === "number")
      .join(" ");

  const getSearchText = searchable ?? defaultSearchable;
  const displayColumns = useMemo(
    () => columns.filter((column) => !hiddenColumns.includes(column.key)),
    [columns, hiddenColumns],
  );

  function toggleColumn(key: string) {
    if (hiddenColumns.includes(key)) {
      setHiddenColumns((current) => current.filter((item) => item !== key));
      return;
    }
    if (displayColumns.length <= 1) return;
    setHiddenColumns((current) => [...current, key]);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? safeRows.filter((r) => getSearchText(r).toLowerCase().includes(q))
      : safeRows.slice();
    const column = columns.find((c) => c.key === sortKey);
    if (column) {
      list = list.sort((a, b) => {
        const va = column.sortValue
          ? column.sortValue(a)
          : renderedText(column.render(a)) || fallbackSortValue(a, column.key);
        const vb = column.sortValue
          ? column.sortValue(b)
          : renderedText(column.render(b)) || fallbackSortValue(b, column.key);
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
        <div className="flex flex-wrap items-end gap-3">
          {filters}
          {allowColumnSelection ? (
            <details className="min-w-[12rem] self-end border-2 border-ae2v-black bg-ae2v-offwhite p-2">
              <summary className="cursor-pointer px-1 text-xs font-bold tracking-[0.12em] uppercase">
                Colonnes affichées
              </summary>
              <fieldset className="mt-2 grid gap-2 border-t-2 border-ae2v-black/15 pt-2">
                <legend className="sr-only">Choisir les colonnes affichées</legend>
                {columns.map((column) => (
                  <label key={column.key} className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                      className="size-4 accent-ae2v-red"
                    />
                    {column.label ?? column.header ?? column.key}
                  </label>
                ))}
              </fieldset>
            </details>
          ) : null}
        </div>
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
                  {displayColumns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={
                        sortKey === c.key ? (dir === "asc" ? "ascending" : "descending") : "none"
                      }
                      className="px-3 py-2 text-left text-[0.65rem] font-bold tracking-[0.14em] uppercase"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 py-2 hover:text-ae2v-green"
                      >
                        {c.label ?? c.header ?? c.key}
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
                            : sortKey === c.key && dir === "desc"
                              ? " (trié décroissant, activer pour inverser)"
                              : " (activer pour trier)"}
                        </span>
                      </button>
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
                    columns={displayColumns}
                    open={openRow === row.id}
                    onToggle={() => setOpenRow((r) => (r === row.id ? null : row.id))}
                    {...(renderDetails ? { renderDetails } : {})}
                    {...(onRowClick ? { onRowClick } : {})}
                    idPrefix={idPrefix}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Vue cartes — mobile / tablette */}
          <ul className="mt-3 space-y-3 lg:hidden">
            {visible.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "border-2 border-ae2v-black bg-card p-4",
                  onRowClick && "cursor-pointer hover:border-ae2v-red",
                )}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                aria-label={onRowClick ? `Ouvrir la ligne ${row.id}` : undefined}
                onClick={(event) => {
                  if (!onRowClick) return;
                  if ((event.target as HTMLElement).closest("button,a,input,select,textarea"))
                    return;
                  onRowClick(row);
                }}
                onKeyDown={(event) => {
                  if (!onRowClick || (event.key !== "Enter" && event.key !== " ")) return;
                  if ((event.target as HTMLElement).closest("button,a,input,select,textarea"))
                    return;
                  event.preventDefault();
                  onRowClick(row);
                }}
              >
                <dl className="grid gap-2 text-sm">
                  {displayColumns.map((c) => (
                    <div key={c.key} className="flex flex-wrap justify-between gap-2">
                      <dt className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                        {c.label ?? c.header ?? c.key}
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
  onRowClick,
  idPrefix,
}: {
  row: T;
  columns: Column<T>[];
  open: boolean;
  onToggle: () => void;
  renderDetails?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  idPrefix: string;
}) {
  return (
    <>
      <tr
        className={cn(
          "border-t-2 border-ae2v-black/15 align-top",
          onRowClick && "cursor-pointer hover:bg-ae2v-offwhite/70",
        )}
        tabIndex={onRowClick ? 0 : undefined}
        aria-label={onRowClick ? `Ouvrir la ligne ${row.id}` : undefined}
        onClick={(event) => {
          if (!onRowClick) return;
          if ((event.target as HTMLElement).closest("button,a,input,select,textarea")) return;
          onRowClick(row);
        }}
        onKeyDown={(event) => {
          if (!onRowClick || (event.key !== "Enter" && event.key !== " ")) return;
          if ((event.target as HTMLElement).closest("button,a,input,select,textarea")) return;
          event.preventDefault();
          onRowClick(row);
        }}
      >
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
  tone?: "neutral" | "green" | "red" | "black" | "yellow";
}) {
  return (
    <span
      className={cn(
        "inline-block border-2 border-ae2v-black px-2 py-0.5 text-[0.7rem] font-bold uppercase",
        tone === "green"
          ? "bg-ae2v-green text-ae2v-black"
          : tone === "red"
            ? "bg-ae2v-red text-ae2v-offwhite"
            : tone === "yellow"
              ? "bg-yellow-300 text-ae2v-black"
              : tone === "black"
                ? "bg-ae2v-black text-ae2v-offwhite"
                : "bg-transparent",
      )}
    >
      {children}
    </span>
  );
}
