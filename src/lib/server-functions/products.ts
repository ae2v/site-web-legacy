import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getPrisma } from "@/lib/db";
import { requireBureauActor } from "@/lib/server/auth";

const productSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  name: z.string().trim().min(2).max(160),
  tagline: z.string().trim().min(2).max(240),
  priceMemberCents: z.number().int().nonnegative().max(10_000_000),
  pricePublicCents: z.number().int().nonnegative().max(10_000_000),
  badge: z.string().trim().max(80).nullable().optional(),
  // Les visuels importés sont recadrés côté client en JPEG carré avant
  // d'arriver ici. La limite protège la server function sans imposer d'URL.
  image: z.string().trim().max(600_000).nullable().optional(),
  sizes: z.array(z.string().trim().min(1).max(30)).max(20),
  helloAssoUrl: z.string().url().max(500).nullable().optional(),
  active: z.boolean(),
});

export type ServerProduct = {
  id: string;
  name: string;
  tagline: string;
  priceMemberCents: number;
  pricePublicCents: number;
  badge: string | null;
  image: string | null;
  sizes: string[];
  helloAssoUrl: string | null;
  active: boolean;
};

function parseSizes(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function toProduct(product: {
  id: string;
  name: string;
  tagline: string;
  priceMemberCents: number;
  pricePublicCents: number;
  badge: string | null;
  image: string | null;
  sizesJson: string;
  helloAssoUrl: string | null;
  active: boolean;
}): ServerProduct {
  return {
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    priceMemberCents: product.priceMemberCents,
    pricePublicCents: product.pricePublicCents,
    badge: product.badge,
    image: product.image,
    sizes: parseSizes(product.sizesJson),
    helloAssoUrl: product.helloAssoUrl,
    active: product.active,
  };
}

export const getProductsServer = createServerFn({ method: "GET" })
  .validator(z.object({ includeInactive: z.boolean().optional() }).optional())
  .handler(async ({ data }): Promise<ServerProduct[]> => {
    const products = await getPrisma().product.findMany({
      ...(data?.includeInactive ? {} : { where: { active: true } }),
      orderBy: { createdAt: "desc" },
    });
    return products.map(toProduct);
  });

export const getBureauProductsServer = createServerFn({ method: "GET" }).handler(async () => {
  await requireBureauActor("read");
  const products = await getPrisma().product.findMany({ orderBy: { createdAt: "desc" } });
  return products.map(toProduct);
});

export const saveProductServer = createServerFn({ method: "POST" })
  .validator(productSchema)
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const payload = {
      name: data.name,
      tagline: data.tagline,
      priceMemberCents: data.priceMemberCents,
      pricePublicCents: data.pricePublicCents,
      badge: data.badge ?? null,
      image: data.image ?? null,
      sizesJson: JSON.stringify(data.sizes),
      helloAssoUrl: data.helloAssoUrl ?? null,
      active: data.active,
    };
    const product = data.id
      ? await prisma.product.update({ where: { id: data.id }, data: payload })
      : await prisma.product.create({ data: payload });
    await prisma.auditLog.create({
      data: {
        action: "PRODUCT_SAVED",
        details: `${product.id} · ${product.name}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    return { ok: true as const, product: toProduct(product) };
  });

export const deleteProductServer = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    const actor = await requireBureauActor("write");
    const prisma = getPrisma();
    const product = await prisma.product.update({
      where: { id: data.id },
      data: { active: false },
    });
    await prisma.auditLog.create({
      data: {
        action: "PRODUCT_ARCHIVED",
        details: `${product.id} · ${product.name}`,
        author: `${actor.firstName} ${actor.lastName}`,
      },
    });
    return { ok: true as const };
  });
