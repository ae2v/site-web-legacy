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
          place: "Le Hangar",
          capacity: 400,
          registered: 356,
          status: "OUVERT",
          waitlist: true,
          registrationOpensAt: "01/09/2026",
          description:
            "Le premier gros rendez-vous de l'année pour toutes les promos. DJ set, vestiaire et navette retour.",
          image: "/images/events/soiree-integration.jpg",
          priceMemberCents: 800,
          pricePublicCents: 1500,
          tiersJson: JSON.stringify([
            { id: "adh", label: "Tarif adhérent", priceCents: 800, audience: "adherent" },
            { id: "membre", label: "Tarif compte étudiant", priceCents: 1200, audience: "membre" },
            { id: "pub", label: "Tarif public", priceCents: 1500, audience: "public" },
          ]),
        },
        {
          id: "afterwork-octobre",
          title: "Afterwork d'octobre",
          slug: "afterwork-octobre",
          kind: "Afterwork",
          date: "Jeudi 15 octobre 2026",
          place: "Café des Arcades",
          capacity: 80,
          registered: 41,
          status: "OUVERT",
          waitlist: false,
          registrationOpensAt: "20/09/2026",
          description:
            "Format court en semaine, entre les cours et la maison. Conso offerte aux adhérents.",
          image: "/images/events/afterwork.jpg",
          priceMemberCents: 0,
          pricePublicCents: 700,
          tiersJson: JSON.stringify([
            { id: "adh", label: "Tarif adhérent", priceCents: 0, audience: "adherent" },
            { id: "membre", label: "Tarif compte étudiant", priceCents: 500, audience: "membre" },
            { id: "pub", label: "Tarif public", priceCents: 700, audience: "public" },
          ]),
        },
        {
          id: "tournoi-esport",
          title: "Tournoi e-sport",
          slug: "tournoi-esport",
          kind: "Tournoi",
          date: "Mercredi 14 octobre 2026",
          place: "Amphi B - IUT Vélizy",
          capacity: 60,
          registered: 60,
          status: "COMPLET",
          waitlist: true,
          registrationOpensAt: "25/09/2026",
          description: "Équipes de 5, arbitrage assuré par le pôle événementiel.",
          image: "/images/events/tournoi-esport.jpg",
          priceMemberCents: 0,
          pricePublicCents: 300,
          tiersJson: JSON.stringify([
            { id: "adh", label: "Tarif adhérent", priceCents: 0, audience: "adherent" },
            { id: "membre", label: "Tarif compte étudiant", priceCents: 300, audience: "membre" },
          ]),
        },
        {
          id: "gala",
          title: "Gala de fin d'année",
          slug: "gala",
          kind: "Gala",
          date: "Vendredi 12 juin 2027",
          place: "Salle Ravel",
          capacity: 300,
          registered: 0,
          status: "BIENTOT",
          waitlist: false,
          registrationOpensAt: "02/03/2027",
          description: "Le grand rendez-vous annuel : dîner, remise des diplômes, soirée.",
          image: "/images/events/gala.jpg",
          priceMemberCents: 2500,
          pricePublicCents: 4000,
          tiersJson: JSON.stringify([
            { id: "adh", label: "Tarif adhérent", priceCents: 2500, audience: "adherent" },
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

  // 3. Seed Team Members
  const teamCount = await prisma.teamMember.count();
  if (teamCount === 0) {
    console.log("Seeding team members...");
    await prisma.teamMember.createMany({
      data: [
        {
          displayName: "Alexis Dubois",
          roleTitle: "Président AE2V",
          pole: "Présidence",
          personalAe2vEmail: "alexis.dubois@ae2v.fr",
          roleEmail: "president@ae2v.fr",
          isOfficer: true,
          bio: "Responsable de la vision et de la coordination générale de l'association.",
          mandateYear: "2026-2027",
        },
        {
          displayName: "Chloé Martin",
          roleTitle: "Trésorière",
          pole: "Trésorerie",
          personalAe2vEmail: "chloe.martin@ae2v.fr",
          roleEmail: "tresorerie@ae2v.fr",
          isOfficer: true,
          bio: "Gestion des comptes, encaissements et facturation des événements.",
          mandateYear: "2026-2027",
        },
        {
          displayName: "Thomas Bernard",
          roleTitle: "Responsable Événementiel",
          pole: "Événementiel",
          personalAe2vEmail: "thomas.bernard@ae2v.fr",
          roleEmail: "evenements@ae2v.fr",
          isOfficer: true,
          bio: "Organisation des soirées, tournois e-sport et afterworks.",
          mandateYear: "2026-2027",
        },
      ],
    });
  }

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
