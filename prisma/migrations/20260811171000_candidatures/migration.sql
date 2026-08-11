CREATE TABLE "Candidature" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pole" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "internalNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Candidature_status_submittedAt_idx" ON "Candidature"("status", "submittedAt");
CREATE INDEX "Candidature_userId_submittedAt_idx" ON "Candidature"("userId", "submittedAt");

ALTER TABLE "Candidature"
ADD CONSTRAINT "Candidature_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
