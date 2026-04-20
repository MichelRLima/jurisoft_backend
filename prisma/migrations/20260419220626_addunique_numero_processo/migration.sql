/*
  Warnings:

  - A unique constraint covering the columns `[numeroProcesso]` on the table `processos` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "processos_numeroProcesso_key" ON "processos"("numeroProcesso");
