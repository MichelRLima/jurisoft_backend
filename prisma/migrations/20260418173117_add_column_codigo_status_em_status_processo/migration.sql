/*
  Warnings:

  - A unique constraint covering the columns `[codigoStatus]` on the table `statusProcesso` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigoStatus` to the `statusProcesso` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "processos" ALTER COLUMN "contato" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "statusProcesso" ADD COLUMN     "codigoStatus" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "statusProcesso_codigoStatus_key" ON "statusProcesso"("codigoStatus");
