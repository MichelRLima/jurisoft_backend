-- DropForeignKey
ALTER TABLE "permissaoDrive" DROP CONSTRAINT "permissaoDrive_usuarioId_fkey";

-- AddForeignKey
ALTER TABLE "permissaoDrive" ADD CONSTRAINT "permissaoDrive_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
