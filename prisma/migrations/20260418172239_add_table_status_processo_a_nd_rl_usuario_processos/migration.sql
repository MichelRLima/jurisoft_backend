-- CreateTable
CREATE TABLE "processos" (
    "id" TEXT NOT NULL,
    "numeroProcesso" TEXT NOT NULL,
    "clienteName" TEXT NOT NULL,
    "numeroDoc" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "idPastaDrive" TEXT NOT NULL,
    "usuarioCriacaoId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rlUsuarioPrcessos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "rlUsuarioPrcessos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statusProcesso" (
    "id" TEXT NOT NULL,
    "nomeStatus" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "statusProcesso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statusProcesso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rlUsuarioPrcessos" ADD CONSTRAINT "rlUsuarioPrcessos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rlUsuarioPrcessos" ADD CONSTRAINT "rlUsuarioPrcessos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
