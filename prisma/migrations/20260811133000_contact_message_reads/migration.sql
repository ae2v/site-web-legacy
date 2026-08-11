CREATE TABLE "ContactMessageRead" (
    "id" TEXT NOT NULL,
    "contactMessageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessageRead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContactMessageRead_contactMessageId_userId_key"
ON "ContactMessageRead"("contactMessageId", "userId");

CREATE INDEX "ContactMessageRead_userId_readAt_idx"
ON "ContactMessageRead"("userId", "readAt");

ALTER TABLE "ContactMessageRead"
ADD CONSTRAINT "ContactMessageRead_contactMessageId_fkey"
FOREIGN KEY ("contactMessageId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContactMessageRead"
ADD CONSTRAINT "ContactMessageRead_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
