import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { randomBytes, webcrypto } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import pg from "pg";

const connectionString = process.env.POSTGRES_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PASSWORD_ITERATIONS = 310_000;

function encode(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

async function hashSeedPassword(password: string) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    512,
  );
  return `pbkdf2$${encode(salt)}$${encode(new Uint8Array(bits))}`;
}

function seedPassword() {
  return `AE2V-${randomBytes(9).toString("base64url")}`;
}

function cardCode(prefix: string, index: number) {
  return `AE2V-2026-${prefix}-${String(index).padStart(4, "0")}`;
}

async function main() {
  console.log("🌱 Starting seeding AE2V database...");

  // Les données applicatives viennent de PostgreSQL. Les comptes fictifs sont
  // explicitement marqués `demo=true` et ne peuvent jamais être confondus avec
  // les comptes des membres du bureau (`demo=false`).
  type SeedAccount = {
    key: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "MEMBRE" | "BUREAU" | "TRESORIER" | "PRESIDENT";
    pole: string | null;
    roleTitle: string | null;
    departement: string;
    niveau: string;
    contributionCents: number;
    contributionStatus: "NON_COTISANT" | "PAIEMENT_EN_ATTENTE" | "PAYEE";
    membershipStatus: "DEMANDE_SOUMISE" | "A_CORRIGER" | "MEMBRE_VALIDE" | "REFUSE";
    emailPrefs: string[];
  };

  const bureauAccounts: SeedAccount[] = [
    [
      "heytham-kortas",
      "Hey’tham",
      "KORTAS",
      "heytham.kortas@ae2v.fr",
      "PRESIDENT",
      "Direction & Partenarial",
      "Président",
      "MMI",
      "BUT2",
    ],
    [
      "alexandre-mariette",
      "Alexandre",
      "MARIETTE",
      "alexandre.mariette@ae2v.fr",
      "BUREAU",
      "Direction",
      "Vice-président",
      "MMI",
      "BUT2",
    ],
    [
      "carla-barruet",
      "Carla",
      "BARRUET",
      "carla.barruet@ae2v.fr",
      "BUREAU",
      "Direction",
      "Secrétaire",
      "MMI",
      "BUT2",
    ],
    [
      "jaden-brival",
      "Jaden",
      "BRIVAL",
      "jaden.brival@ae2v.fr",
      "TRESORIER",
      "Direction & Finance",
      "Trésorière",
      "MMI",
      "BUT2",
    ],
    [
      "selma-chadli",
      "Selma",
      "CHADLI",
      "selma.chadli@ae2v.fr",
      "BUREAU",
      "Communication",
      "Chargée de communication",
      "MMI",
      "BUT3",
    ],
    [
      "mathis-laporte-kouassi",
      "Mathis",
      "LAPORTE KOUASSI",
      "mathis.laporte.kouassi@ae2v.fr",
      "BUREAU",
      "Communication",
      "Chargé de communication",
      "Informatique",
      "BUT2",
    ],
    [
      "yasmine-lacheb",
      "Yasmine",
      "LACHEB",
      "yasmine.lacheb@ae2v.fr",
      "BUREAU",
      "Communication",
      "Chargée de communication",
      "MMI",
      "BUT2",
    ],
    [
      "gaelle-rasolomanana",
      "Gaelle",
      "RASOLOMANANA",
      "gaelle.rasolomanana@ae2v.fr",
      "BUREAU",
      "Communication",
      "Chargée de communication",
      "MMI",
      "BUT3",
    ],
    [
      "julline-azer",
      "Julline",
      "AZER",
      "julline.azer@ae2v.fr",
      "BUREAU",
      "Communication",
      "Chargée de communication",
      "MMI",
      "BUT2",
    ],
    [
      "bastian-noel",
      "Bastian",
      "NOËL",
      "bastian.noel@ae2v.fr",
      "BUREAU",
      "Communication & Numérique",
      "Responsable de l’infrastructure numérique",
      "MMI",
      "BUT2",
    ],
    [
      "loan-jean",
      "Loan",
      "JEAN",
      "loan.jean@ae2v.fr",
      "BUREAU",
      "Communication & Numérique",
      "Responsable Web & Discord",
      "MMI",
      "BUT2",
    ],
    [
      "franck-manickam",
      "Franck",
      "MANICKAM",
      "franck.manickam@ae2v.fr",
      "BUREAU",
      "Événementiel",
      "Chargé de l’événementiel",
      "MMI",
      "BUT2",
    ],
    [
      "zohra-sekkal",
      "Zohra",
      "SEKKAL",
      "zohra.sekkal@ae2v.fr",
      "BUREAU",
      null,
      "Membre du bureau",
      "MMI",
      "BUT3",
    ],
    [
      "matteo-cakarun",
      "Matteo",
      "CAKARUN",
      "matteo.cakarun@ae2v.fr",
      "BUREAU",
      null,
      "Membre du bureau",
      "MMI",
      "BUT2",
    ],
    [
      "aurelia-okoto",
      "Aurélia",
      "OKOTO",
      "aurelia.okoto@ae2v.fr",
      "BUREAU",
      null,
      "Membre du bureau",
      "MMI",
      "BUT2",
    ],
  ].map(([key, firstName, lastName, email, role, pole, roleTitle, departement, niveau]) => ({
    key,
    firstName,
    lastName,
    email,
    role,
    pole,
    roleTitle,
    departement,
    niveau,
    contributionCents: 1500,
    contributionStatus: "PAYEE",
    membershipStatus: "MEMBRE_VALIDE",
    emailPrefs: ["EVENEMENTS", "BDE", "INFORMATIONS_GENERALES"],
  }));

  const fakeFirstNames = [
    "Noa",
    "Inès",
    "Lina",
    "Ethan",
    "Maya",
    "Tom",
    "Nina",
    "Adam",
    "Chloé",
    "Hugo",
    "Léa",
    "Sacha",
    "Jade",
    "Louis",
    "Emma",
    "Nolan",
    "Zoé",
    "Yanis",
    "Manon",
    "Enzo",
    "Camille",
    "Arthur",
    "Mila",
    "Nathan",
    "Sarah",
    "Léo",
    "Louna",
    "Ilyes",
    "Anaïs",
    "Mathéo",
  ];
  const fakeLastNames = [
    "Perrin",
    "Faure",
    "Bernard",
    "Petit",
    "Roux",
    "Garnier",
    "Mercier",
    "Blanc",
    "Robin",
    "Moulin",
    "Caron",
    "Giraud",
    "Legrand",
    "Baron",
    "Chevalier",
    "Boucher",
    "Renard",
    "Dumont",
    "Fournier",
    "Marchand",
    "Dupuis",
    "Lambert",
    "Bonnet",
    "Masson",
    "Girard",
    "Andre",
    "Collet",
    "Brun",
    "Renaud",
    "Pons",
  ];
  const departments = ["MMI", "Informatique", "GEII", "GMP", "RT"];
  const fakeAccounts: SeedAccount[] = fakeFirstNames.map((firstName, index) => {
    const lastName = fakeLastNames[index]!;
    const paid = index % 4 !== 0;
    const pending = index % 7 === 0;
    return {
      key: `faux-${String(index + 1).padStart(2, "0")}`,
      firstName,
      lastName,
      email: `${firstName}.${lastName}@comptes.ae2v.fr`.toLowerCase(),
      role: "MEMBRE",
      pole: null,
      roleTitle: null,
      departement: departments[index % departments.length]!,
      niveau: `BUT${(index % 3) + 1}`,
      contributionCents: paid ? 1200 + (index % 4) * 300 : pending ? 1500 : 0,
      contributionStatus: paid ? "PAYEE" : pending ? "PAIEMENT_EN_ATTENTE" : "NON_COTISANT",
      membershipStatus:
        index % 6 === 0 ? "A_CORRIGER" : index % 6 === 1 ? "DEMANDE_SOUMISE" : "MEMBRE_VALIDE",
      emailPrefs: index % 3 === 0 ? ["EVENEMENTS"] : ["EVENEMENTS", "BOUTIQUE"],
    };
  });

  const legacyFakeEmails = [
    "alexis.bureau@ae2v.fr",
    "chloe.tresorerie@ae2v.fr",
    "lucas.cotisant@student.fr",
    "sarah.attente@student.fr",
    "noa.demo@etu.uvsq.fr",
    "ines.demo@etu.uvsq.fr",
    "hugo.demo@ae2v.fr",
    "presidence@ae2v.fr",
  ];
  await prisma.user.updateMany({
    where: { email: { in: legacyFakeEmails } },
    data: {
      demo: true,
      role: "MEMBRE",
      pole: null,
      roleTitle: null,
      membershipStatus: "MEMBRE_VALIDE",
    },
  });
  await prisma.user.updateMany({
    where: {
      role: { in: ["BUREAU", "TRESORIER", "PRESIDENT"] },
      email: { notIn: bureauAccounts.map((account) => account.email) },
    },
    data: { demo: true, role: "MEMBRE", pole: null, roleTitle: null },
  });

  const seededUsers = new Map<string, Awaited<ReturnType<typeof prisma.user.upsert>>>();
  for (const [accountIndex, account] of [...bureauAccounts, ...fakeAccounts].entries()) {
    const existing = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true, password: true },
    });
    const generatedPassword = existing?.password ? null : seedPassword();
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        ...(generatedPassword ? { password: await hashSeedPassword(generatedPassword) } : {}),
        firstName: account.firstName,
        lastName: account.lastName,
        demo: !bureauAccounts.some((bureau) => bureau.email === account.email),
        role: account.role,
        pole: account.pole,
        roleTitle: account.roleTitle,
        departement: account.departement,
        niveau: account.niveau,
        contributionCents: account.contributionCents,
        contributionStatus: account.contributionStatus,
        membershipStatus: account.membershipStatus,
        emailPrefs: account.emailPrefs,
        schoolYear: "2026-2027",
        memberSince: "01/09/2026",
        requestedAt: "25/08/2026",
        validatedAt: "01/09/2026",
      },
      create: {
        email: account.email,
        password: await hashSeedPassword(generatedPassword ?? seedPassword()),
        demo: !bureauAccounts.some((bureau) => bureau.email === account.email),
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        pole: account.pole,
        roleTitle: account.roleTitle,
        departement: account.departement,
        niveau: account.niveau,
        phone: `06 ${String(10 + (account.key.length % 80)).padStart(2, "0")} ${String(20 + account.key.length).padStart(2, "0")} ${String(30 + account.key.length).padStart(2, "0")} ${String(40 + account.key.length).padStart(2, "0")}`,
        studentId: `226${String(10000 + account.key.length * 37).slice(-5)}`,
        groupe: `${account.departement}-G${(account.key.length % 4) + 1}`,
        interestsJson: JSON.stringify(["Vie associative", "Événementiel", "Projets étudiants"]),
        volunteer:
          account.role === "MEMBRE" ? (account.key.length % 2 ? "oui" : "peut-etre") : "oui",
        message: "Je souhaite participer aux projets et aux événements de l’AE2V.",
        rgpdAcceptedAt: new Date("2026-08-25T10:00:00.000Z"),
        statutsAcceptedAt: new Date("2026-08-25T10:00:00.000Z"),
        contributionCents: account.contributionCents,
        contributionStatus: account.contributionStatus,
        membershipStatus: account.membershipStatus,
        cardCode: cardCode(account.role === "MEMBRE" ? "ADH" : "BDE", accountIndex + 1),
        memberSince: "01/09/2026",
        requestedAt: "25/08/2026",
        validatedAt: "01/09/2026",
        schoolYear: "2026-2027",
        emailPrefs: account.emailPrefs,
        emailPreferenceToken: `seed-pref-${account.key}`,
      },
    });
    seededUsers.set(account.key, user);
    if (generatedPassword)
      console.log(`Compte ${account.email} · mot de passe initial : ${generatedPassword}`);
  }

  async function seedAccountRelations(account: SeedAccount, index: number) {
    const user = seededUsers.get(account.key);
    if (!user) return;
    const membershipId = `seed-membership-${account.key}`;
    await prisma.membership.upsert({
      where: { userId_schoolYear: { userId: user.id, schoolYear: "2026-2027" } },
      update: {
        status: account.membershipStatus,
        contributionStatus: account.contributionStatus,
        amountCents: account.contributionCents,
      },
      create: {
        id: membershipId,
        userId: user.id,
        schoolYear: "2026-2027",
        status: account.membershipStatus,
        contributionStatus: account.contributionStatus,
        amountCents: account.contributionCents,
        validatedAt: new Date("2026-09-01T10:00:00.000Z"),
      },
    });
    await prisma.dossier.upsert({
      where: { email: account.email },
      update: {
        firstName: account.firstName,
        lastName: account.lastName,
        phone: user.phone,
        studentId: user.studentId,
        departement: account.departement,
        niveau: account.niveau,
        groupe: user.groupe,
        interestsJson: user.interestsJson,
        volunteer: user.volunteer,
        message: user.message,
        emailPrefsJson: JSON.stringify(account.emailPrefs),
        status: account.membershipStatus,
        contributionStatus: account.contributionStatus,
        contributionCents: account.contributionCents,
        schoolYear: "2026-2027",
      },
      create: {
        id: `seed-dossier-${account.key}`,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone: user.phone,
        studentId: user.studentId,
        departement: account.departement,
        niveau: account.niveau,
        groupe: user.groupe,
        interestsJson: user.interestsJson,
        volunteer: user.volunteer,
        message: user.message,
        emailPrefsJson: JSON.stringify(account.emailPrefs),
        emailPreferenceToken: `seed-dossier-pref-${account.key}`,
        rgpdAcceptedAt: new Date("2026-08-25T10:00:00.000Z"),
        statutsAcceptedAt: new Date("2026-08-25T10:00:00.000Z"),
        imageRight: true,
        status: account.membershipStatus,
        contributionStatus: account.contributionStatus,
        contributionCents: account.contributionCents,
        schoolYear: "2026-2027",
        submittedAt: "25/08/2026",
        validatedAt: "01/09/2026",
      },
    });
    const paymentId = `seed-payment-${account.key}`;
    const invoiceId = `seed-invoice-${account.key}`;
    const paid = account.contributionStatus === "PAYEE";
    if (account.contributionCents > 0) {
      await prisma.payment.upsert({
        where: { id: paymentId },
        update: {
          userId: user.id,
          amountCents: account.contributionCents,
          status: paid ? "CONFIRME" : "EN_ATTENTE",
          kind: "COTISATION",
          paymentMethod: "HelloAsso",
          confirmedAt: paid ? new Date("2026-09-01T12:00:00.000Z") : null,
        },
        create: {
          id: paymentId,
          userId: user.id,
          amountCents: account.contributionCents,
          status: paid ? "CONFIRME" : "EN_ATTENTE",
          kind: "COTISATION",
          paymentMethod: "HelloAsso",
          confirmedAt: paid ? new Date("2026-09-01T12:00:00.000Z") : null,
        },
      });
      if (paid) {
        await prisma.invoice.upsert({
          where: { id: invoiceId },
          update: {
            userId: user.id,
            customerName: `${account.firstName} ${account.lastName}`,
            customerEmail: account.email,
            paymentMethod: "HelloAsso",
            priceCents: account.contributionCents,
            description: "Cotisation AE2V 2026-2027",
            status: "PAYEE",
            linesJson: JSON.stringify([
              {
                description: "Cotisation AE2V 2026-2027",
                qty: 1,
                unitPriceCents: account.contributionCents,
              },
            ]),
          },
          create: {
            id: invoiceId,
            userId: user.id,
            date: "01/09/2026",
            customerName: `${account.firstName} ${account.lastName}`,
            customerEmail: account.email,
            paymentMethod: "HelloAsso",
            priceCents: account.contributionCents,
            description: "Cotisation AE2V 2026-2027",
            status: "PAYEE",
            linesJson: JSON.stringify([
              {
                description: "Cotisation AE2V 2026-2027",
                qty: 1,
                unitPriceCents: account.contributionCents,
              },
            ]),
          },
        });
        await prisma.payment.update({ where: { id: paymentId }, data: { invoiceId } });
      }
    } else {
      await prisma.payment.deleteMany({ where: { id: paymentId } });
      await prisma.invoice.deleteMany({ where: { id: invoiceId } });
    }
    if (index % 2 === 0) {
      const eventId = index % 4 === 0 ? "soiree-integration" : "afterwork-octobre";
      const registrationId = `seed-registration-${account.key}`;
      const priceCents = eventId === "soiree-integration" ? (paid ? 800 : 1500) : 0;
      const registrationStatus = priceCents > 0 && !paid ? "PAIEMENT_EN_ATTENTE" : "CONFIRMEE";
      await prisma.eventRegistration.upsert({
        where: { id: registrationId },
        update: {
          eventId,
          userId: user.id,
          userEmail: account.email,
          participantName: `${account.firstName} ${account.lastName}`,
          participantPhone: user.phone,
          legalConsentAt: new Date("2026-09-01T10:00:00.000Z"),
          termsConsentAt: new Date("2026-09-01T10:00:00.000Z"),
          imageConsentAt: new Date("2026-09-01T10:00:00.000Z"),
          tier: paid ? "adherent" : "public",
          priceCents,
          status: registrationStatus,
        },
        create: {
          id: registrationId,
          eventId,
          userId: user.id,
          userEmail: account.email,
          participantName: `${account.firstName} ${account.lastName}`,
          participantPhone: user.phone,
          legalConsentAt: new Date("2026-09-01T10:00:00.000Z"),
          termsConsentAt: new Date("2026-09-01T10:00:00.000Z"),
          imageConsentAt: new Date("2026-09-01T10:00:00.000Z"),
          tier: paid ? "adherent" : "public",
          priceCents,
          status: registrationStatus,
        },
      });
      await prisma.ticket.upsert({
        where: { registrationId },
        update: {
          eventId,
          userId: user.id,
          userEmail: account.email,
          tier: paid ? "Tarif cotisant" : "Tarif public",
          priceCents,
          status: registrationStatus === "CONFIRMEE" ? "valide" : "en_attente_paiement",
          code: `AE2V-2026-TKT-${account.key.toUpperCase()}`,
        },
        create: {
          id: `seed-ticket-${account.key}`,
          eventId,
          registrationId,
          userId: user.id,
          userEmail: account.email,
          tier: paid ? "Tarif cotisant" : "Tarif public",
          priceCents,
          status: registrationStatus === "CONFIRMEE" ? "valide" : "en_attente_paiement",
          code: `AE2V-2026-TKT-${account.key.toUpperCase()}`,
        },
      });
    }
    if (index % 3 === 0) {
      const orderId = `seed-order-${account.key}`;
      const productName = index % 2 ? "T-shirt AE2V" : "Hoodie AE2V";
      const totalCents = index % 2 ? 1800 : 3500;
      const orderStatus = ["PAYEE", "EN_ATTENTE", "A_PREPARER", "PRETE", "REMIS", "ANNULEE"][
        Math.floor(index / 3) % 6
      ]!;
      const lines = [
        {
          productName,
          variant: index % 2 ? "M · Noir" : "L · Rouge",
          quantity: 1,
          unitPriceCents: totalCents,
        },
      ];
      await prisma.order.upsert({
        where: { id: orderId },
        update: {
          userId: user.id,
          userEmail: account.email,
          customerName: `${account.firstName} ${account.lastName}`,
          date: "02/09/2026",
          totalCents,
          status: orderStatus,
          linesJson: JSON.stringify(lines),
          notes: "Commande enregistrée depuis HelloAsso pour le suivi bureau.",
        },
        create: {
          id: orderId,
          userId: user.id,
          userEmail: account.email,
          customerName: `${account.firstName} ${account.lastName}`,
          date: "02/09/2026",
          totalCents,
          status: orderStatus,
          linesJson: JSON.stringify(lines),
          notes: "Commande enregistrée depuis HelloAsso pour le suivi bureau.",
        },
      });
      await prisma.orderLine.deleteMany({ where: { orderId } });
      await prisma.orderLine.create({
        data: {
          orderId,
          productName,
          variant: lines[0]!.variant,
          quantity: 1,
          unitPriceCents: totalCents,
        },
      });
      if (orderStatus === "PAYEE" || orderStatus === "REMIS")
        await prisma.invoice.upsert({
          where: { id: `seed-order-invoice-${account.key}` },
          update: {
            userId: user.id,
            orderId,
            customerName: `${account.firstName} ${account.lastName}`,
            customerEmail: account.email,
            paymentMethod: "HelloAsso",
            priceCents: totalCents,
            description: productName,
            status: "PAYEE",
            linesJson: JSON.stringify(lines),
          },
          create: {
            id: `seed-order-invoice-${account.key}`,
            userId: user.id,
            orderId,
            date: "02/09/2026",
            customerName: `${account.firstName} ${account.lastName}`,
            customerEmail: account.email,
            paymentMethod: "HelloAsso",
            priceCents: totalCents,
            description: productName,
            status: "PAYEE",
            linesJson: JSON.stringify(lines),
          },
        });
      else {
        await prisma.invoice.deleteMany({ where: { id: `seed-order-invoice-${account.key}` } });
      }
      if (orderStatus !== "ANNULEE") {
        const orderInvoice = await prisma.invoice.findUnique({
          where: { id: `seed-order-invoice-${account.key}` },
          select: { id: true },
        });
        await prisma.payment.upsert({
          where: { id: `seed-order-payment-${account.key}` },
          update: {
            userId: user.id,
            orderId,
            invoiceId: orderInvoice?.id ?? null,
            amountCents: totalCents,
            status: orderStatus === "PAYEE" || orderStatus === "REMIS" ? "CONFIRME" : "EN_ATTENTE",
            kind: "COMMANDE_BOUTIQUE",
            paymentMethod: "HelloAsso",
            provider: "HelloAsso",
            providerReference: `HA-ORDER-${index + 1}`,
            confirmedAt:
              orderStatus === "PAYEE" || orderStatus === "REMIS"
                ? new Date("2026-09-02T12:00:00.000Z")
                : null,
          },
          create: {
            id: `seed-order-payment-${account.key}`,
            userId: user.id,
            orderId,
            invoiceId: orderInvoice?.id ?? null,
            amountCents: totalCents,
            status: orderStatus === "PAYEE" || orderStatus === "REMIS" ? "CONFIRME" : "EN_ATTENTE",
            kind: "COMMANDE_BOUTIQUE",
            paymentMethod: "HelloAsso",
            provider: "HelloAsso",
            providerReference: `HA-ORDER-${index + 1}`,
            confirmedAt:
              orderStatus === "PAYEE" || orderStatus === "REMIS"
                ? new Date("2026-09-02T12:00:00.000Z")
                : null,
          },
        });
      } else {
        await prisma.payment.deleteMany({ where: { id: `seed-order-payment-${account.key}` } });
      }
    }
    if (index % 5 === 0) {
      await prisma.candidature.upsert({
        where: { id: `seed-candidature-${account.key}` },
        update: {
          userId: user.id,
          name: `${account.firstName} ${account.lastName}`,
          email: account.email,
          pole: index % 2 ? "Communication" : "Événementiel",
          motivation: "Je souhaite participer activement à la vie de l’AE2V.",
          availability: "Selon les réunions et les événements",
          status: index % 10 === 0 ? "ENTRETIEN_PROPOSE" : "EN_ATTENTE",
        },
        create: {
          id: `seed-candidature-${account.key}`,
          userId: user.id,
          name: `${account.firstName} ${account.lastName}`,
          email: account.email,
          pole: index % 2 ? "Communication" : "Événementiel",
          motivation: "Je souhaite participer activement à la vie de l’AE2V.",
          availability: "Selon les réunions et les événements",
          status: index % 10 === 0 ? "ENTRETIEN_PROPOSE" : "EN_ATTENTE",
        },
      });
    }
    if (account.role === "MEMBRE" && index % 2 === 0) {
      await prisma.contactMessage.upsert({
        where: { id: `seed-contact-${account.key}` },
        update: {
          name: `${account.firstName} ${account.lastName}`,
          email: account.email,
          sujet: index % 4 === 0 ? "Question sur mon adhésion" : "Participation à un événement",
          message:
            index % 4 === 0
              ? "Bonjour, je souhaite vérifier l'état de ma demande d'adhésion et savoir si un document est manquant."
              : "Bonjour, je souhaite aider sur les prochains événements et connaître les prochaines dates.",
          status: index % 6 === 0 ? "NON_LU" : index % 6 === 2 ? "EN_COURS" : "TRAITE",
          sentAt: "03/09/2026 à 14h20",
        },
        create: {
          id: `seed-contact-${account.key}`,
          name: `${account.firstName} ${account.lastName}`,
          email: account.email,
          sujet: index % 4 === 0 ? "Question sur mon adhésion" : "Participation à un événement",
          message:
            index % 4 === 0
              ? "Bonjour, je souhaite vérifier l'état de ma demande d'adhésion et savoir si un document est manquant."
              : "Bonjour, je souhaite aider sur les prochains événements et connaître les prochaines dates.",
          status: index % 6 === 0 ? "NON_LU" : index % 6 === 2 ? "EN_COURS" : "TRAITE",
          sentAt: "03/09/2026 à 14h20",
        },
      });
    }
  }
  for (const [index, account] of [...bureauAccounts, ...fakeAccounts].entries())
    await seedAccountRelations(account, index);

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
  await prisma.teamMember.deleteMany({
    where: { displayName: { notIn: teamSeed.map((member) => member.displayName) } },
  });
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
    const linkedUser = member.personalAe2vEmail
      ? await prisma.user.findUnique({
          where: { email: member.personalAe2vEmail },
          select: { id: true },
        })
      : null;
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
          userId: linkedUser?.id ?? null,
          mandateYear: member.mandateYear,
          publicVisible: true,
        },
      });
    } else {
      await prisma.teamMember.create({ data: { ...member, userId: linkedUser?.id ?? null } });
    }
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
