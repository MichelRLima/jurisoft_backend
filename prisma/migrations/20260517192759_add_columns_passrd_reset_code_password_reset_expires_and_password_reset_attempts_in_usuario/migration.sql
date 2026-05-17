-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordResetCode" TEXT,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3);
