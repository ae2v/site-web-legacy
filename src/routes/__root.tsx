import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BrandCursor } from "@/components/brand/cursor";
import { SessionBar } from "@/components/layout/session-bar";
import { DemoSessionProvider } from "@/lib/demo-session";
import { SiteFeedbackProvider } from "@/components/ui/site-feedback";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" role="alert">
      <div className="w-full max-w-md border-2 border-ae2v-black bg-card p-6 text-center shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-ae2v-red">AE2V</p>
        <h1 className="mt-3 font-impact text-3xl uppercase tracking-tight text-foreground">
          La page n’a pas pu être chargée
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Une erreur temporaire est survenue. Réessayez ou revenez à l’accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              void router
                .invalidate()
                .then(() => reset())
                .catch(() => window.location.reload());
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Retour à l’accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AE2V — BDE de Vélizy" },
      {
        name: "description",
        content:
          "AE2V, l'association étudiante de Vélizy : événements, adhésion, boutique et avantages. Always further, together.",
      },
      { name: "author", content: "AE2V" },
      { property: "og:title", content: "AE2V — BDE de Vélizy" },
      {
        property: "og:description",
        content: "Événements, adhésion, boutique et avantages étudiants. Always further, together.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;900&family=Raleway:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:bg-ae2v-green focus:px-4 focus:py-3 focus:text-ae2v-black focus:font-bold focus:uppercase"
      >
        Aller au contenu
      </a>
      <BrandCursor />
      <SiteFeedbackProvider>
        <DemoSessionProvider>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <SessionBar />
            <SiteHeader />
            <main id="contenu" className="flex-1">
              {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
              <Outlet />
            </main>
            <SiteFooter />
          </div>
        </DemoSessionProvider>
      </SiteFeedbackProvider>
    </QueryClientProvider>
  );
}
