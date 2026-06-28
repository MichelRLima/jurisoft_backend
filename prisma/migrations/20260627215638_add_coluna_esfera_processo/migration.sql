-- CreateEnum
CREATE TYPE "EsferaProcesso" AS ENUM ('JUDICIAL', 'ADMINISTRATIVO', 'EXTRAJUDICIAL');

-- AlterTable
ALTER TABLE "processos" ADD COLUMN     "esfera" "EsferaProcesso" NOT NULL DEFAULT 'JUDICIAL';
