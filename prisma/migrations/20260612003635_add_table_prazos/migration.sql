-- CreateEnum
CREATE TYPE "TipoPrazo" AS ENUM ('PETICAO', 'AUDIENCIA', 'DILIGENCIA', 'REUNIAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusPrazo" AS ENUM ('PENDENTE', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "prazos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataPrazo" TIMESTAMP(3) NOT NULL,
    "processoId" TEXT NOT NULL,
    "status" "StatusPrazo" NOT NULL DEFAULT 'PENDENTE',
    "tipo" "TipoPrazo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "prazos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "prazos" ADD CONSTRAINT "prazos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
