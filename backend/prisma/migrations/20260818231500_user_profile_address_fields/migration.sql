-- Adds editable profile/address fields to "User" so the account settings
-- page (name, email, cpf, phone, birth date, billing address) has real
-- columns to persist to instead of being purely client-side mock state.

ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "birthDate" TEXT;
ALTER TABLE "User" ADD COLUMN "addressCep" TEXT;
ALTER TABLE "User" ADD COLUMN "addressStreet" TEXT;
ALTER TABLE "User" ADD COLUMN "addressNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "addressComplement" TEXT;
ALTER TABLE "User" ADD COLUMN "addressNeighborhood" TEXT;
ALTER TABLE "User" ADD COLUMN "addressCity" TEXT;
ALTER TABLE "User" ADD COLUMN "addressState" TEXT;
