-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ANNULE', 'REMBOURSE', 'PARTIELLEMENT_REMBOURSE');

ALTER TYPE "MembershipStatus" ADD VALUE 'A_CORRIGER';

-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN     "birthDate" TEXT,
ADD COLUMN     "contributionCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailPrefsJson" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "emailUnsubscribedAt" TIMESTAMP(3),
ADD COLUMN     "emailPreferenceToken" TEXT,
ADD COLUMN     "groupe" TEXT,
ADD COLUMN     "imageRight" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "interestsJson" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "message" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rgpdAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "schoolYear" TEXT NOT NULL DEFAULT '2026-2027',
ADD COLUMN     "statutsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "volunteer" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "linesJson" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'EMISE',
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "helloAssoId" TEXT,
ADD COLUMN     "notes" TEXT;

CREATE UNIQUE INDEX "Order_helloAssoId_key" ON "Order"("helloAssoId");

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "helloAssoUrl" TEXT;

-- Normalize the legacy order state before exposing the unified Bureau statuses.
UPDATE "Order" SET "status" = 'EN_ATTENTE' WHERE "status" = 'EN_PREPARATION';
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'EN_ATTENTE';

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "publicVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "secondaryPolesJson" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "pole" DROP NOT NULL,
ALTER COLUMN "personalAe2vEmail" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailPreferenceToken" TEXT,
ADD COLUMN     "emailUnsubscribedAt" TIMESTAMP(3),
ALTER COLUMN "emailPrefs" SET DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'DEMANDE_SOUMISE',
    "contributionStatus" "ContributionStatus" NOT NULL DEFAULT 'NON_COTISANT',
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "eventId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "refundedAmountCents" INTEGER,
    "status" "PaymentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "kind" TEXT NOT NULL,
    "provider" TEXT,
    "providerReference" TEXT,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "variant" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "recipient" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'BDE',
    "status" TEXT NOT NULL DEFAULT 'ENREGISTRE',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_schoolYear_status_idx" ON "Membership"("schoolYear", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_schoolYear_key" ON "Membership"("userId", "schoolYear");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_status_idx" ON "EventRegistration"("eventId", "status");

-- CreateIndex
CREATE INDEX "EventRegistration_userId_createdAt_idx" ON "EventRegistration"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_providerReference_idx" ON "Payment"("providerReference");

-- CreateIndex
CREATE INDEX "EmailLog_recipient_createdAt_idx" ON "EmailLog"("recipient", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_category_status_idx" ON "EmailLog"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailPreferenceToken_key" ON "User"("emailPreferenceToken");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_emailPreferenceToken_key" ON "Dossier"("emailPreferenceToken");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
