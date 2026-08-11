import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import pg from "pg";

const connectionString = process.env.POSTGRES_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seeding AE2V database...");

  // 1. Seed Demo Users
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("Seeding demo users...");
    await prisma.user.createMany({
      data: [
        {
          email: "alexis.bureau@ae2v.fr",
          firstName: "Alexis",
          lastName: "Dubois",
          role: "BUREAU",
          pole: "Présidence",
          roleTitle: "Président",
          departement: "GEII",
          niveau: "BUT3",
          contributionStatus: "PAYEE",
          membershipStatus: "MEMBRE_VALIDE",
          cardCode: "AE2V-2026-USR-8X9K2M4P",
          contributionCents: 1500,
          memberSince: "15/09/2024",
          validatedAt: "15/09/2024",
          schoolYear: "2026-2027",
        },
        {
          email: "chloe.tresorerie@ae2v.fr",
          firstName: "Chloé",
          lastName: "Martin",
          role: "TRESORIER",
          pole: "Trésorerie",
          roleTitle: "Trésorière",
          departement: "GEII",
          niveau: "BUT2",
          contributionStatus: "PAYEE",
          membershipStatus: "MEMBRE_VALIDE",
          cardCode: "AE2V-2026-USR-3R8W1L9V",
          contributionCents: 1500,
          memberSince: "10/09/2025",
          validatedAt: "10/09/2025",
          schoolYear: "2026-2027",
        },
        {
          email: "lucas.cotisant@student.fr",
          firstName: "Lucas",
          lastName: "Moreau",
          role: "MEMBRE",
          departement: "Informatique",
          niveau: "BUT2",
          contributionStatus: "PAYEE",
          membershipStatus: "MEMBRE_VALIDE",
          cardCode: "AE2V-2026-USR-7K9P2M4X",
          contributionCents: 1200,
          memberSince: "20/09/2025",
          validatedAt: "20/09/2025",
          schoolYear: "2026-2027",
        },
        {
          email: "sarah.attente@student.fr",
          firstName: "Sarah",
          lastName: "Petit",
          role: "MEMBRE",
          departement: "Mechatronique",
          niveau: "BUT1",
          contributionStatus: "PAIEMENT_EN_ATTENTE",
          membershipStatus: "MEMBRE_VALIDE",
          cardCode: "AE2V-2026-USR-4M9X2K7P",
          contributionCents: 1200,
          memberSince: "01/09/2026",
          validatedAt: "01/09/2026",
          schoolYear: "2026-2027",
        },
      ],
    });
  }

  // 2. Seed Events
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    console.log("Seeding initial events...");
    await prisma.event.createMany({
      data: [
        {
          id: "soiree-integration",
          title: "Soirée d'intégration",
          slug: "soiree-integration",
          kind: "Soirée",
          date: "Jeudi 24 septembre 2026",
          doors: "21h00 — 03h00",
          place: "Le Hangar",
          address: "Vélizy-Villacoublay · adresse communiquée après inscription",
          summary: "Le premier gros rendez-vous de l'année pour toutes les promos.",
          capacity: 400,
          registered: 356,
          status: "OUVERT",
          waitlist: true,
          registrationOpensAt: "01/09/2026",
          registrationClosesAt: "23/09/2026",
          description:
            "Le premier gros rendez-vous de l'année pour toutes les promos. DJ set, vestiaire et navette retour.",
          image: "/images/events/soiree-integration.jpg",
          priceMemberCents: 800,
          pricePublicCents: 1500,
          tiersJson: JSON.stringify([
            { id: "adh", label: "Tarif cotisant", priceCents: 800, audience: "adherent" },
            { id: "pub", label: "Tarif public", priceCents: 1500, audience: "public" },
          ]),
        },
        {
          id: "afterwork-octobre",
          title: "Afterwork d'octobre",
          slug: "afterwork-octobre",
          kind: "Afterwork",
          date: "Jeudi 15 octobre 2026",
          doors: "18h30 — 22h00",
          place: "Café des Arcades",
          address: "Vélizy-Villacoublay",
          summary: "Un format court en semaine, entre les cours et la maison.",
          capacity: 80,
          registered: 41,
          status: "OUVERT",
          waitlist: false,
          registrationOpensAt: "20/09/2026",
          registrationClosesAt: "14/10/2026",
          description:
            "Format court en semaine, entre les cours et la maison. Conso offerte aux adhérents.",
          image: "/images/events/afterwork.jpg",
          priceMemberCents: 0,
          pricePublicCents: 700,
          tiersJson: JSON.stringify([
            { id: "adh", label: "Tarif cotisant", priceCents: 0, audience: "adherent" },
            { id: "pub", label: "Tarif public", priceCents: 700, audience: "public" },
          ]),
        },
        {
          id: "tournoi-esport",
          title: "Tournoi e-sport",
          slug: "tournoi-esport",
          kind: "Tournoi",
          date: "Mercredi 14 octobre 2026",
          doors: "14h00 — 20h00",
          place: "Amphi B - IUT Vélizy",
          address: "IUT de Vélizy · Amphi B",
          summary: "Équipes de 5 et arbitrage assuré par le pôle événementiel.",
          capacity: 60,
          registered: 60,
          status: "COMPLET",
          waitlist: true,
          registrationOpensAt: "25/09/2026",
          registrationClosesAt: "13/10/2026",
          description: "Équipes de 5, arbitrage assuré par le pôle événementiel.",
          image: "/images/events/tournoi-esport.jpg",
          priceMemberCents: 0,
          pricePublicCents: 300,
          tiersJson: JSON.stringify([
            { id: "adh", label: "Tarif cotisant", priceCents: 0, audience: "adherent" },
          ]),
        },
        {
          id: "gala",
          title: "Gala de fin d'année",
          slug: "gala",
          kind: "Gala",
          date: "Vendredi 12 juin 2027",
          doors: "19h00 — 02h00",
          place: "Salle Ravel",
          address: "Vélizy-Villacoublay",
          summary: "Le grand rendez-vous annuel de l'AE2V.",
          capacity: 300,
          registered: 0,
          status: "BIENTOT",
          waitlist: false,
          registrationOpensAt: "02/03/2027",
          registrationClosesAt: "05/06/2027",
          description: "Le grand rendez-vous annuel : dîner, remise des diplômes, soirée.",
          image: "/images/events/gala.jpg",
          priceMemberCents: 2500,
          pricePublicCents: 4000,
          tiersJson: JSON.stringify([
            { id: "adh", label: "Tarif cotisant", priceCents: 2500, audience: "adherent" },
            {
              id: "pub",
              label: "Tarif public / accompagnant",
              priceCents: 4000,
              audience: "public",
            },
          ]),
        },
      ],
    });
  }

  // Les événements peuvent déjà exister en production : complète les champs
  // éditoriaux introduits après la première version sans toucher aux événements
  // ajoutés manuellement par le bureau.
  const officialEventContent: Record<
    string,
    { doors: string; address: string; summary: string; registrationClosesAt: string }
  > = {
    "soiree-integration": {
      doors: "21h00 — 03h00",
      address: "Vélizy-Villacoublay · adresse communiquée après inscription",
      summary: "Le premier gros rendez-vous de l'année pour toutes les promos.",
      registrationClosesAt: "23/09/2026",
    },
    "afterwork-octobre": {
      doors: "18h30 — 22h00",
      address: "Vélizy-Villacoublay",
      summary: "Un format court en semaine, entre les cours et la maison.",
      registrationClosesAt: "14/10/2026",
    },
    "tournoi-esport": {
      doors: "14h00 — 20h00",
      address: "IUT de Vélizy · Amphi B",
      summary: "Équipes de 5 et arbitrage assuré par le pôle événementiel.",
      registrationClosesAt: "13/10/2026",
    },
    gala: {
      doors: "19h00 — 02h00",
      address: "Vélizy-Villacoublay",
      summary: "Le grand rendez-vous annuel de l'AE2V.",
      registrationClosesAt: "05/06/2027",
    },
  };
  for (const [id, content] of Object.entries(officialEventContent)) {
    await prisma.event.updateMany({ where: { id }, data: content });
  }

  // Normalise aussi les événements déjà présents : les anciennes versions
  // utilisaient parfois un tarif « compte étudiant », désormais supprimé.
  const storedEvents = await prisma.event.findMany({
    select: { id: true, tiersJson: true },
  });
  for (const event of storedEvents) {
    let rawTiers: Array<Record<string, unknown>> = [];
    try {
      const parsed: unknown = JSON.parse(event.tiersJson);
      rawTiers = Array.isArray(parsed)
        ? parsed.filter(
            (tier): tier is Record<string, unknown> => typeof tier === "object" && tier !== null,
          )
        : [];
    } catch {
      rawTiers = [];
    }
    const cleaned = rawTiers.filter((tier) => {
      const label = typeof tier.label === "string" ? tier.label.toLowerCase() : "";
      return tier.audience !== "membre" && !label.includes("compte étudiant");
    });
    const system = [
      { id: "public", label: "Tarif public", audience: "public" },
      { id: "adherent", label: "Tarif cotisant", audience: "adherent" },
      { id: "bureau", label: "Tarif membre du bureau", audience: "bureau" },
    ];
    const tiers = system.map((base) => {
      const existing = cleaned.find(
        (tier) => tier.id === base.id || tier.audience === base.audience,
      );
      return {
        ...base,
        priceCents:
          typeof existing?.priceCents === "number" && Number.isInteger(existing.priceCents)
            ? Math.max(0, existing.priceCents)
            : 0,
        disabled: existing?.disabled === true,
        system: true,
        isMandatory: true,
        ...(typeof existing?.note === "string" && existing.note.trim()
          ? { note: existing.note.trim() }
          : {}),
      };
    });
    const custom = cleaned.filter(
      (tier) => !system.some((base) => base.id === tier.id || base.audience === tier.audience),
    );
    await prisma.event.update({
      where: { id: event.id },
      data: {
        tiersJson: JSON.stringify([...tiers, ...custom]),
        pricePublicCents: tiers[0].priceCents,
        priceMemberCents: tiers[1].priceCents,
      },
    });
  }

  // 3. Seed Team Members
  const teamCount = await prisma.teamMember.count();
  console.log(`Ensuring official team members (existing: ${teamCount})...`);
  const teamSeed = [
    {
      displayName: "Hey’tham KORTAS",
      displayOrder: 0,
      roleTitle: "Président",
      pole: "Direction",
      personalAe2vEmail: "heytham.kortas@ae2v.fr",
      roleEmail: "president@ae2v.fr",
      secondaryPolesJson: JSON.stringify(["Partenarial"]),
      isOfficer: true,
      mandateYear: "2026-2027",
    },
    {
      displayName: "Alexandre MARIETTE",
      displayOrder: 1,
      roleTitle: "Vice-président",
      pole: "Direction",
      personalAe2vEmail: "alexandre.mariette@ae2v.fr",
      roleEmail: "vice-president@ae2v.fr",
      isOfficer: true,
      mandateYear: "2026-2027",
    },
    {
      displayName: "Carla BARRUET",
      displayOrder: 2,
      roleTitle: "Secrétaire",
      pole: "Direction",
      personalAe2vEmail: "carla.barruet@ae2v.fr",
      roleEmail: "secretaire@ae2v.fr",
      isOfficer: true,
      mandateYear: "2026-2027",
    },
    {
      displayName: "Jaden BRIVAL",
      displayOrder: 3,
      roleTitle: "Trésorière",
      pole: "Finance",
      personalAe2vEmail: "jaden.brival@ae2v.fr",
      roleEmail: "tresoriere@ae2v.fr",
      secondaryPolesJson: JSON.stringify(["Direction"]),
      isOfficer: true,
      mandateYear: "2026-2027",
    },
    {
      displayName: "Bastian NOËL",
      displayOrder: 4,
      roleTitle: "Responsable de l’infrastructure numérique",
      pole: "Numérique",
      personalAe2vEmail: "bastian.noel@ae2v.fr",
      secondaryPolesJson: JSON.stringify(["Communication"]),
      mandateYear: "2026-2027",
    },
    {
      displayName: "Loan JEAN",
      displayOrder: 5,
      roleTitle: "Responsable Web & Discord",
      pole: "Numérique",
      personalAe2vEmail: "loan.jean@ae2v.fr",
      secondaryPolesJson: JSON.stringify(["Communication"]),
      mandateYear: "2026-2027",
    },
    {
      displayName: "Franck MANICKAM",
      displayOrder: 6,
      roleTitle: "Chargé de l’événementiel",
      pole: "Événementiel",
      personalAe2vEmail: "franck.manickam@ae2v.fr",
      mandateYear: "2026-2027",
    },
    {
      displayName: "Selma CHADLI",
      displayOrder: 7,
      roleTitle: "Chargée de communication",
      pole: "Communication",
      personalAe2vEmail: "selma.chadli@ae2v.fr",
      mandateYear: "2026-2027",
    },
    {
      displayName: "Mathis LAPORTE KOUASSI",
      displayOrder: 8,
      roleTitle: "Chargé de communication",
      pole: "Communication",
      personalAe2vEmail: "mathis.laporte.kouassi@ae2v.fr",
      mandateYear: "2026-2027",
    },
    {
      displayName: "Yasmine LACHEB",
      displayOrder: 9,
      roleTitle: "Chargée de communication",
      pole: "Communication",
      personalAe2vEmail: "yasmine.lacheb@ae2v.fr",
      mandateYear: "2026-2027",
    },
    {
      displayName: "Gaelle RASOLOMANANA",
      displayOrder: 10,
      roleTitle: "Chargée de communication",
      pole: "Communication",
      personalAe2vEmail: "gaelle.rasolomanana@ae2v.fr",
      mandateYear: "2026-2027",
    },
    {
      displayName: "Julline AZER",
      displayOrder: 11,
      roleTitle: "Chargée de communication",
      pole: "Communication",
      personalAe2vEmail: "julline.azer@ae2v.fr",
      mandateYear: "2026-2027",
    },
    {
      displayName: "Zohra SEKKAL",
      displayOrder: 12,
      roleTitle: "Membre du bureau",
      pole: null,
      personalAe2vEmail: "zohra.sekkal@ae2v.fr",
      mandateYear: "2026-2027",
    },
    {
      displayName: "Matteo CAKARUN",
      displayOrder: 13,
      roleTitle: "Membre du bureau",
      pole: null,
      personalAe2vEmail: "matteo.cakarun@ae2v.fr",
      mandateYear: "2026-2027",
    },
    {
      displayName: "Aurélia OKOTO",
      displayOrder: 14,
      roleTitle: "Membre du bureau",
      pole: null,
      personalAe2vEmail: "aurelia.okoto@ae2v.fr",
      mandateYear: "2026-2027",
    },
  ];
  const enrichedTeamSeed = teamSeed.map((member) => {
    const poles = [
      member.pole,
      ...(JSON.parse(member.secondaryPolesJson ?? "[]") as string[]),
    ].filter(
      (pole, index, values): pole is string => Boolean(pole) && values.indexOf(pole) === index,
    );
    const isBastian = member.displayName === "Bastian NOËL";
    const officerRoleByName: Record<string, string> = {
      "Hey’tham KORTAS": "Président",
      "Alexandre MARIETTE": "Vice-président",
      "Carla BARRUET": "Secrétaire",
      "Jaden BRIVAL": "Trésorière",
    };
    return {
      ...member,
      roleTitlesJson: JSON.stringify(
        isBastian
          ? ["Responsable de l’infrastructure numérique", "Webmaster adjoint"]
          : [member.roleTitle],
      ),
      officerRole: officerRoleByName[member.displayName] ?? null,
      polesJson: JSON.stringify(poles),
      showDefaultPoleTitles: !isBastian,
    };
  });
  for (const member of enrichedTeamSeed) {
    const existing = await prisma.teamMember.findFirst({
      where: { displayName: member.displayName },
      select: { id: true },
    });
    if (existing) {
      await prisma.teamMember.update({
        where: { id: existing.id },
        data: {
          displayName: member.displayName,
          displayOrder: member.displayOrder,
          roleTitle: member.roleTitle,
          pole: member.pole,
          secondaryPolesJson: member.secondaryPolesJson,
          roleTitlesJson: member.roleTitlesJson,
          officerRole: member.officerRole,
          polesJson: member.polesJson,
          showDefaultPoleTitles: member.showDefaultPoleTitles,
          personalAe2vEmail: member.personalAe2vEmail,
          roleEmail: member.roleEmail,
          isOfficer: member.isOfficer,
          mandateYear: member.mandateYear,
          publicVisible: true,
        },
      });
    } else {
      await prisma.teamMember.create({ data: member });
    }
  }

  // Les trois fiches historiques étaient uniquement des données de démonstration.
  // On les conserve pour ne pas supprimer de données, mais elles ne doivent pas
  // apparaître sur le site public après le passage au roster officiel.
  await prisma.teamMember.updateMany({
    where: {
      displayName: { in: ["Alexis Dubois", "Chloé Martin", "Thomas Bernard"] },
    },
    data: { publicVisible: false },
  });

  // 4. Seed Shop Products
  const prodCount = await prisma.product.count();
  if (prodCount === 0) {
    console.log("Seeding shop products...");
    await prisma.product.createMany({
      data: [
        {
          id: "hoodie-ae2v-2026",
          name: "Hoodie AE2V 2026",
          tagline: "Broderie poitrine Red Hat + sérigraphie dos Anton impact",
          priceMemberCents: 2800,
          pricePublicCents: 3500,
          badge: "Bestseller",
          sizesJson: JSON.stringify(["S", "M", "L", "XL", "XXL"]),
        },
        {
          id: "tshirt-promo",
          name: "T-Shirt Promo GEII / Info",
          tagline: "Coton lourd 220g, coupe oversize",
          priceMemberCents: 1200,
          pricePublicCents: 1800,
          sizesJson: JSON.stringify(["XS", "S", "M", "L", "XL"]),
        },
        {
          id: "gobelet-ae2v",
          name: "Ecocup Réutilisable AE2V",
          tagline: "Obligatoire pour les boissons en soirée et événements",
          priceMemberCents: 100,
          pricePublicCents: 200,
          sizesJson: JSON.stringify(["25cl"]),
        },
      ],
    });
  }

  console.log("✅ AE2V Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
