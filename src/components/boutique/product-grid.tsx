import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight } from "lucide-react";

import { TapeLabel } from "@/components/brand";
import { HELLOASSO_SHOP_URL, formatPrice } from "@/data/shop";
import { getDynamicShopProducts } from "@/lib/dynamic-store";
import { getProductsServer } from "@/lib/server-functions/products";

export function ProductGrid() {
  const [products, setProducts] = useState(import.meta.env.DEV ? getDynamicShopProducts() : []);
  const loadProducts = useServerFn(getProductsServer);

  useEffect(() => {
    void loadProducts({ data: undefined })
      .then((serverProducts) => {
        const fallbackImage = import.meta.env.DEV ? (getDynamicShopProducts()[0]?.image ?? "") : "";
        setProducts(
          serverProducts.map((product) => ({
            id: product.id,
            name: product.name,
            tagline: product.tagline,
            priceMember: product.priceMemberCents,
            pricePublic: product.pricePublicCents,
            sizes: product.sizes,
            image: product.image ?? fallbackImage,
            ...(product.badge ? { badge: product.badge } : {}),
            ...(product.helloAssoUrl ? { helloAssoUrl: product.helloAssoUrl } : {}),
          })),
        );
      })
      .catch(() => {
        if (import.meta.env.DEV) setProducts(getDynamicShopProducts());
      });
    const handleChanged = () => {
      if (import.meta.env.DEV) setProducts(getDynamicShopProducts());
    };
    window.addEventListener("ae2v_products_changed", handleChanged);
    return () => window.removeEventListener("ae2v_products_changed", handleChanged);
  }, [loadProducts]);

  return (
    <div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} className="group relative">
            <article className="flex h-full flex-col border-2 border-ae2v-black bg-ae2v-offwhite transition-transform duration-200 group-hover:-translate-y-1 group-focus-within:-translate-y-1">
              <div className="relative overflow-hidden border-b-2 border-ae2v-black bg-white">
                <img
                  src={product.image}
                  alt={`${product.name} — visuel de démonstration`}
                  width={900}
                  height={900}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                />
                {product.badge ? (
                  <span className="absolute left-0 top-3 bg-ae2v-green px-3 py-1 font-display text-xs uppercase tracking-widest text-ae2v-black">
                    {product.badge}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="font-display text-xl uppercase leading-none tracking-wide text-ae2v-black">
                  <a
                    href={product.helloAssoUrl ?? HELLOASSO_SHOP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="interactive"
                    data-cursor-label="Voir sur HelloAsso"
                    className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ae2v-red focus-visible:ring-offset-2"
                  >
                    {product.name}
                    <span className="sr-only"> — commander sur HelloAsso (nouvel onglet)</span>
                  </a>
                </h3>

                <p className="text-sm leading-snug text-ae2v-black/75">{product.tagline}</p>

                <p className="text-xs uppercase tracking-widest text-ae2v-black/60">
                  Tailles : {product.sizes.join(" · ")}
                </p>

                <div className="mt-auto flex items-end justify-between gap-3 border-t-2 border-ae2v-black/15 pt-3">
                  <p className="leading-tight">
                    <span className="block font-display text-2xl text-ae2v-red">
                      {formatPrice(product.priceMember)}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-ae2v-black/60">
                      adhérent · {formatPrice(product.pricePublic)} public
                    </span>
                  </p>
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center border-2 border-ae2v-black bg-ae2v-black text-ae2v-offwhite transition-colors group-hover:bg-ae2v-red group-hover:border-ae2v-red"
                  >
                    <ArrowUpRight className="size-5" />
                  </span>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-2 border-dashed border-ae2v-black/30 p-4">
        <TapeLabel tone="green">
          {import.meta.env.DEV ? "Articles de démonstration" : "Catalogue indicatif"}
        </TapeLabel>
        <p className="text-sm text-ae2v-black/75">
          Les visuels et tarifs sont indicatifs : la vente réelle se fait sur la boutique officielle
          HelloAsso de l’AE2V.
        </p>
      </div>
    </div>
  );
}
