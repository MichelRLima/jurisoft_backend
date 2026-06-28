-- CreateTable
CREATE TABLE "dadoAdicional" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "campos" JSONB NOT NULL,
    "processoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dadoAdicional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dadoAdicional" ADD CONSTRAINT "dadoAdicional_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
