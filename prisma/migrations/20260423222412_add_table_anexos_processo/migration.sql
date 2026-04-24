-- CreateTable
CREATE TABLE "anexosProcesso" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "anexoDriveId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "anexosProcesso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "anexosProcesso" ADD CONSTRAINT "anexosProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
