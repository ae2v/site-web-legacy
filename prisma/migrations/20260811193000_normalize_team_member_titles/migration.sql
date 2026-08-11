-- Keep the legacy display title aligned with the first custom title.
-- The complete list remains in roleTitlesJson and is rendered separately.
UPDATE "TeamMember"
SET "roleTitle" = 'Responsable de l’infrastructure numérique'
WHERE "displayName" = 'Bastian NOËL'
  AND "roleTitlesJson" = '["Responsable de l’infrastructure numérique","Webmaster adjoint"]';
