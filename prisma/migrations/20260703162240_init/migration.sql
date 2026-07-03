-- CreateEnum
CREATE TYPE "EsferaProcesso" AS ENUM ('JUDICIAL', 'ADMINISTRATIVO', 'EXTRAJUDICIAL');

-- CreateEnum
CREATE TYPE "AcaoLog" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "TipoAtualizacaoProcesso" AS ENUM ('PROCESSO_ALTERADO', 'ANEXOS', 'PRAZO');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('ATUALIZACAO_PROCESSO', 'NOVO_ANEXO', 'NOVO_PROCESSO', 'NOVO_PRAZO', 'UPDATE_STATUS_PRAZO', 'PRAZO_VENCENDO', 'PRAZO_VENCIDO');

-- CreateEnum
CREATE TYPE "TipoPrazo" AS ENUM ('PETICAO', 'AUDIENCIA', 'DILIGENCIA', 'REUNIAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusPrazo" AS ENUM ('PENDENTE', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "login" TEXT,
    "senha" TEXT,
    "email" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "passwordResetCode" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0,
    "permissaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes" (
    "id" TEXT NOT NULL,
    "codigoPermissao" TEXT NOT NULL,
    "nomePermissao" TEXT NOT NULL,
    "descricaoPermissao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "tipo" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "contato" TEXT,
    "email" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "indicacao" TEXT,
    "docIndicacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processos" (
    "id" TEXT NOT NULL,
    "numeroProcesso" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "usuarioCriacaoId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "tipoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "esfera" "EsferaProcesso" NOT NULL DEFAULT 'JUDICIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "processos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rlUsuarioProcesso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "rlUsuarioProcesso_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "tipoProcesso" (
    "id" TEXT NOT NULL,
    "codigoTipo" TEXT NOT NULL,
    "nomeTipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "tipoProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexosProcesso" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "anexosProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" "AcaoLog" NOT NULL,
    "atorId" TEXT NOT NULL,
    "dadosAnteriores" JSONB,
    "dadosNovos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atualizacoesProcesso" (
    "id" TEXT NOT NULL,
    "processoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "tipo" "TipoAtualizacaoProcesso",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atualizacoesProcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioAtorId" TEXT,
    "processoId" TEXT,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rl_notificacao_usuario" (
    "id" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "notificacaoId" TEXT NOT NULL,

    CONSTRAINT "rl_notificacao_usuario_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_codigoPermissao_key" ON "permissoes"("codigoPermissao");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_usuarioId_key" ON "perfil"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "processos_numeroProcesso_key" ON "processos"("numeroProcesso");

-- CreateIndex
CREATE UNIQUE INDEX "statusProcesso_codigoStatus_key" ON "statusProcesso"("codigoStatus");

-- CreateIndex
CREATE UNIQUE INDEX "tipoProcesso_codigoTipo_key" ON "tipoProcesso"("codigoTipo");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_entidadeId_idx" ON "audit_logs"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "rl_notificacao_usuario_usuarioId_isRead_idx" ON "rl_notificacao_usuario"("usuarioId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "rl_notificacao_usuario_usuarioId_notificacaoId_key" ON "rl_notificacao_usuario"("usuarioId", "notificacaoId");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil" ADD CONSTRAINT "perfil_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statusProcesso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipoProcesso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processos" ADD CONSTRAINT "processos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rlUsuarioProcesso" ADD CONSTRAINT "rlUsuarioProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rlUsuarioProcesso" ADD CONSTRAINT "rlUsuarioProcesso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexosProcesso" ADD CONSTRAINT "anexosProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_atorId_fkey" FOREIGN KEY ("atorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacoesProcesso" ADD CONSTRAINT "atualizacoesProcesso_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statusProcesso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacoesProcesso" ADD CONSTRAINT "atualizacoesProcesso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacoesProcesso" ADD CONSTRAINT "atualizacoesProcesso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usuarioAtorId_fkey" FOREIGN KEY ("usuarioAtorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rl_notificacao_usuario" ADD CONSTRAINT "rl_notificacao_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rl_notificacao_usuario" ADD CONSTRAINT "rl_notificacao_usuario_notificacaoId_fkey" FOREIGN KEY ("notificacaoId") REFERENCES "notificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prazos" ADD CONSTRAINT "prazos_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dadoAdicional" ADD CONSTRAINT "dadoAdicional_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "processos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
