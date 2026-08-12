import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { DiagonalStripe, DotCloud } from "@/components/brand";
import { legalNav, publicNav, secondaryNav } from "./nav-config";

/**
 * Pied de page public AE2V — noir, marques techniques, rappel de marque.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-cursor-scheme="light"
      className="relative overflow-hidden bg-ae2v-black text-ae2v-offwhite"
    >
      <DiagonalStripe height={8} className="text-ae2v-red" />
      <DotCloud className="absolute top-8 right-6 text-ae2v-red/40" columns={8} rows={6} />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <Logo variant="vertical" tone="white" alt="" className="h-32 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-ae2v-offwhite/70">
            Association étudiante de Vélizy. Événements, vie de campus et projets étudiants.
          </p>
        </div>

        <nav aria-label="Plan du site">
          <h2 className="font-impact text-2xl uppercase">Naviguer</h2>
          <ul className="mt-4 flex flex-col gap-1">
            {[...publicNav, ...secondaryNav].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="tap-44 inline-flex items-center text-sm font-semibold uppercase tracking-[0.06em] hover:text-ae2v-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-impact text-2xl uppercase">Nos liens</h2>
          <ul className="mt-4 flex flex-col gap-1">
            <li>
              <Link to="/" className="tap-44 inline-flex items-center gap-2 text-sm hover:text-ae2v-green">Site AE2V</Link>
            </li>
            <li>
              <a href="https://discord.gg/z85wnSmdnH" target="_blank" rel="noreferrer" className="tap-44 inline-flex items-center gap-2 text-sm hover:text-ae2v-green">Discord AE2V</a>
            </li>
            <li>
              <a
                href="mailto:ae2v.asso@gmail.com"
                className="tap-44 inline-flex items-center gap-2 text-sm hover:text-ae2v-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green"
              >
                <Mail aria-hidden="true" className="size-4" />
                ae2v.asso@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/bde.velizy/"
                target="_blank"
                rel="noreferrer"
                className="tap-44 inline-flex items-center gap-2 text-sm hover:text-ae2v-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green"
              >
                <Instagram aria-hidden="true" className="size-4" />
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/Ae2velizy"
                target="_blank"
                rel="noreferrer"
                className="tap-44 inline-flex items-center gap-2 text-sm hover:text-ae2v-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green"
              >
                <Facebook aria-hidden="true" className="size-4" />
                Facebook
              </a>
            </li>
            <li>
              <Link
                to="/contact"
                hash="formulaire-contact"
                className="tap-44 inline-flex items-center gap-2 text-sm hover:text-ae2v-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green"
              >
                Nous contacter
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                hash="nos-liens"
                className="tap-44 inline-flex items-center gap-2 text-sm hover:text-ae2v-green focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ae2v-green"
              >
                Tous nos liens
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-ae2v-offwhite/15">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-xs tracking-[0.12em] uppercase text-ae2v-offwhite/60">
            © {year} AE2V — Toujours plus loin, ensemble
          </p>
          <nav aria-label="Informations légales">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalNav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="tap-44 inline-flex items-center text-xs tracking-[0.1em] uppercase text-ae2v-offwhite/70 hover:text-ae2v-green"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
