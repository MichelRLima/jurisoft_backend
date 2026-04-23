/*
  Warnings:

  - Added the required column `processoId` to the `permissaoDrive` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "permissaoDrive" ADD COLUMN     "processoId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "permissaoDrive" ADD CONSTRAINT "permissaoDrive_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
