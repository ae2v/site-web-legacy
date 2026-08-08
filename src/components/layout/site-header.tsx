import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, UserRound } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { DiagonalStripe } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { publicNav } from "./nav-config";
import { useDemoSession } from "@/lib/demo-session";

/**
 * En-tête public AE2V.
 * - rouge dominant, géométrie carrée ;
 * - une seule action primaire visible (Adhérer) ;
 * - cibles tactiles >= 44px, menu mobile déroulant.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { account } = useDemoSession();

  return (
    <header
      data-cursor-scheme="light"
      className="sticky top-0 z-50 bg-ae2v-red text-ae2v-offwhite"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="tap-44 flex items-center focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green"
        >
          <Logo variant="horizontal" tone="white" priority alt="" className="h-10 w-auto md:h-12" />
          <span className="sr-only">AE2V — Accueil</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {publicNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ "data-current": "true", "aria-current": "page" }}
                  className={cn(
                    "inline-flex h-11 items-center px-3 text-sm font-bold uppercase tracking-[0.08em]",
                    "border-b-4 border-transparent transition-colors hover:border-ae2v-green",
                    "data-[current=true]:border-ae2v-green",
                    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {!account && (
            <>
              <Button asChild variant="black" size="sm" className="hidden h-11 sm:inline-flex">
                <Link to="/connexion">
                  <UserRound aria-hidden="true" />
                  Se connecter
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden h-11 md:inline-flex">
                <Link to="/adherer">Adhérer</Link>
              </Button>
            </>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="tap-44 inline-flex items-center justify-center border-2 border-ae2v-offwhite focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green lg:hidden"
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
          </button>
        </div>
      </div>

      <DiagonalStripe height={8} className="text-ae2v-black" />

      {open && (
        <div id="menu-mobile" className="border-t-2 border-ae2v-black bg-ae2v-black lg:hidden">
          <nav aria-label="Navigation mobile" className="mx-auto w-full max-w-7xl px-4 py-4">
            <ul className="flex flex-col">
              {publicNav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: item.to === "/" }}
                    activeProps={{ "data-current": "true", "aria-current": "page" }}
                    className="flex min-h-14 flex-col justify-center border-b border-ae2v-offwhite/20 py-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green data-[current=true]:text-ae2v-green"
                  >
                    <span className="font-impact text-2xl leading-none uppercase">{item.label}</span>
                    <span className="text-xs text-ae2v-offwhite/70">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {!account && (
              <>
                <Button asChild className="mt-4 w-full" size="lg">
                  <Link to="/adherer" onClick={() => setOpen(false)}>
                    Adhérer à l'AE2V
                  </Link>
                </Button>
                <Button asChild className="mt-2 w-full" size="lg" variant="black">
                  <Link to="/connexion" onClick={() => setOpen(false)}>
                    Se connecter
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;
