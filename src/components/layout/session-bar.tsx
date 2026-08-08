import { Link } from "@tanstack/react-router";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { roleLabels, useDemoSession } from "@/lib/demo-session";

/**
 * Bandeau de session visible sur TOUTES les pages quand un compte de
 * démonstration est actif : qui je suis, quel rôle, et déconnexion accessible
 * en un seul geste (cible 44px).
 */
export function SessionBar() {
  const { account, signOut, isBureau } = useDemoSession();
  if (!account) return null;

  return (
    <div
      data-cursor-scheme="light"
      className="border-b-2 border-ae2v-black bg-ae2v-black text-ae2v-offwhite"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-2 bg-ae2v-green px-2 py-1 text-[0.65rem] font-bold tracking-[0.16em] text-ae2v-black uppercase">
            Démo
          </span>
          <p className="flex min-w-0 items-center gap-2 text-sm">
            <UserRound aria-hidden="true" className="size-4 shrink-0 text-ae2v-green" />
            <span className="truncate font-bold">
              {account.firstName} {account.lastName}
            </span>
            <span className="hidden text-ae2v-offwhite/70 sm:inline">
              · {roleLabels[account.role]}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:ml-auto md:flex md:items-center">
          <Button
            asChild
            variant="black"
            size="sm"
            className="h-11 w-full border-2 border-ae2v-offwhite/40 md:w-auto"
          >
            <Link to="/espace">Mon espace</Link>
          </Button>
          {isBureau && (
            <Button
              asChild
              variant="black"
              size="sm"
              className="h-11 w-full border-2 border-ae2v-offwhite/40 md:w-auto"
            >
              <Link to="/bureau">
                <ShieldCheck aria-hidden="true" />
                Bureau
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            className={`h-11 w-full md:w-auto ${isBureau ? "col-span-2" : ""}`}
            onClick={signOut}
          >
            <LogOut aria-hidden="true" />
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
