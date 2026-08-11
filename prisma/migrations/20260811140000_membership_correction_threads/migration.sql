ALTER TABLE "Dossier"
ADD COLUMN "correctionToken" TEXT,
ADD COLUMN "correctionRequestedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Dossier_correctionToken_key" ON "Dossier"("correctionToken");

CREATE TABLE "MembershipCorrection" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MembershipCorrection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MembershipCorrection_dossierId_createdAt_idx"
ON "MembershipCorrection"("dossierId", "createdAt");

ALTER TABLE "MembershipCorrection"
ADD CONSTRAINT "MembershipCorrection_dossierId_fkey"
FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
