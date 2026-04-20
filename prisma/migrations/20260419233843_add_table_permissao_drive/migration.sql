-- CreateTable
CREATE TABLE "permissaoDrive" (
    "id" TEXT NOT NULL,
    "idPastaDrive" TEXT NOT NULL,
    "idPermissao" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "permissaoDrive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissaoDrive_usuarioId_idPastaDrive_key" ON "permissaoDrive"("usuarioId", "idPastaDrive");

-- AddForeignKey
ALTER TABLE "permissaoDrive" ADD CONSTRAINT "permissaoDrive_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
