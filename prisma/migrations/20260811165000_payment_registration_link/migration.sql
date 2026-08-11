ALTER TABLE "Payment" ADD COLUMN "registrationId" TEXT;

CREATE INDEX "Payment_registrationId_status_idx" ON "Payment"("registrationId", "status");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_registrationId_fkey"
FOREIGN KEY ("registrationId") REFERENCES "EventRegistration"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
