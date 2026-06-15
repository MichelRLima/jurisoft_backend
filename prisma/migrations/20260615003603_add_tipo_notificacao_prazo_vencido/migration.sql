-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoNotificacao" ADD VALUE 'PRAZO_VENCENDO';
ALTER TYPE "TipoNotificacao" ADD VALUE 'PRAZO_VENCIDO';

-- DropForeignKey
ALTER TABLE "notificacao" DROP CONSTRAINT "notificacao_usuarioAtorId_fkey";

-- AlterTable
ALTER TABLE "notificacao" ALTER COLUMN "usuarioAtorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usuarioAtorId_fkey" FOREIGN KEY ("usuarioAtorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
