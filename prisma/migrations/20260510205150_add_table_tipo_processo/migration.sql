/*
  Warnings:

  - Added the required column `tipoId` to the `processos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "processos" ADD COLUMN     "tipoId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "tipoProcesso" (
    "id" TEXT NOT NULL,
    "codigoTipo" TEXT NOT NULL,
    "nomeTipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tipoProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipoProcesso_codigoTipo_key" ON "tipoProcesso"("codigoTipo");

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipoProcesso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
