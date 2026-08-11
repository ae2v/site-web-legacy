-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBRE', 'BUREAU', 'TRESORIER', 'PRESIDENT');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('DEMANDE_SOUMISE', 'MEMBRE_VALIDE', 'REFUSE');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('NON_COTISANT', 'PAIEMENT_EN_ATTENTE', 'PAYEE');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('NON_PUBLIE', 'OUVERT', 'COMPLET', 'BIENTOT', 'TERMINE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBRE',
    "pole" TEXT,
    "roleTitle" TEXT,
    "departement" TEXT NOT NULL DEFAULT 'GEII',
    "niveau" TEXT NOT NULL DEFAULT 'BUT1',
    "contributionStatus" "ContributionStatus" NOT NULL DEFAULT 'NON_COTISANT',
    "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'DEMANDE_SOUMISE',
    "cardCode" TEXT NOT NULL,
    "contributionCents" INTEGER NOT NULL DEFAULT 0,
    "memberSince" TEXT,
    "requestedAt" TEXT,
    "validatedAt" TEXT,
    "schoolYear" TEXT NOT NULL DEFAULT '2026-2027',
    "emailPrefs" TEXT[] DEFAULT ARRAY['newsletter']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'DEMANDE_SOUMISE',
    "contributionStatus" "ContributionStatus" NOT NULL DEFAULT 'NON_COTISANT',
    "submittedAt" TEXT NOT NULL,
    "validatedAt" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Soirée',
    "date" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "registered" INTEGER NOT NULL DEFAULT 0,
    "status" "EventStatus" NOT NULL DEFAULT 'OUVERT',
    "waitlist" BOOLEAN NOT NULL DEFAULT false,
    "registrationOpensAt" TEXT,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "pricePublicCents" INTEGER NOT NULL DEFAULT 0,
    "priceMemberCents" INTEGER NOT NULL DEFAULT 0,
    "tiersJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'valide',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "priceMemberCents" INTEGER NOT NULL,
    "pricePublicCents" INTEGER NOT NULL,
    "badge" TEXT,
    "image" TEXT,
    "sizesJson" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_PREPARATION',
    "linesJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "pole" TEXT NOT NULL,
    "personalAe2vEmail" TEXT NOT NULL,
    "roleEmail" TEXT,
    "isOfficer" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "photoUrl" TEXT,
    "mandateYear" TEXT NOT NULL DEFAULT '2026-2027',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NON_LU',
    "sentAt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Système',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cardCode_key" ON "User"("cardCode");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_email_key" ON "Dossier"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_personalAe2vEmail_key" ON "TeamMember"("personalAe2vEmail");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
