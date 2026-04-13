/*
  Warnings:

  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Usuario";

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

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_usuarioId_key" ON "perfil"("usuarioId");

-- AddForeignKey
ALTER TABLE "perfil" ADD CONSTRAINT "perfil_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
