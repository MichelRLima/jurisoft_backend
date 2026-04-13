-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
