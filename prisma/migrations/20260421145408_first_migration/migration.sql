-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "login" TEXT,
    "senha" TEXT,
    "email" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sobrenome" TEXT NOT NULL,
    "telefone" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "usuarioId" TEXT NOT NULL,
    "foto" TEXT,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos" (
    "id" TEXT NOT NULL,
    "numeroProcesso" TEXT NOT NULL,
    "clienteName" TEXT NOT NULL,
    "clienteDoc" TEXT NOT NULL,
    "contato" TEXT,
    "email" TEXT,
    "descricao" TEXT NOT NULL,
    "pastaDriveId" TEXT NOT NULL,
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
    "codigoStatus" TEXT NOT NULL,
    "nomeStatus" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "statusProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissaoDrive" (
    "id" TEXT NOT NULL,
    "pastaDriveId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "permissaoDrive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_usuarioId_key" ON "perfil"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "processos_numeroProcesso_key" ON "processos"("numeroProcesso");

-- CreateIndex
CREATE UNIQUE INDEX "statusProcesso_codigoStatus_key" ON "statusProcesso"("codigoStatus");

-- CreateIndex
CREATE UNIQUE INDEX "permissaoDrive_usuarioId_pastaDriveId_key" ON "permissaoDrive"("usuarioId", "pastaDriveId");

-- AddForeignKey
ALTER TABLE "perfil" ADD CONSTRAINT "perfil_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statusProcesso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rlUsuarioPrcessos" ADD CONSTRAINT "rlUsuarioPrcessos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rlUsuarioPrcessos" ADD CONSTRAINT "rlUsuarioPrcessos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissaoDrive" ADD CONSTRAINT "permissaoDrive_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
