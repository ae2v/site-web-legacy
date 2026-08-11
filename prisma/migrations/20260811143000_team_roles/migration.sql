ALTER TABLE "TeamMember"
ADD COLUMN "roleTitlesJson" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN "officerRole" TEXT;

UPDATE "TeamMember"
SET "roleTitlesJson" = json_build_array("roleTitle")::text
WHERE "roleTitlesJson" = '[]';
