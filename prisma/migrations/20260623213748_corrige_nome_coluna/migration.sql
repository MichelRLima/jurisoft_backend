/*
  Warnings:

  - You are about to drop the column `indicadoPor` on the `clientes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "indicadoPor",
ADD COLUMN     "indicacao" TEXT;
