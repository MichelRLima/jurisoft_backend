/*
  Warnings:

  - You are about to drop the column `anexoDriveId` on the `anexosProcesso` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `anexosProcesso` table. All the data in the column will be lost.
  - You are about to drop the column `pastaDriveId` on the `processos` table. All the data in the column will be lost.
  - Added the required column `caminhoArquivo` to the `anexosProcesso` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `anexosProcesso` DROP COLUMN `anexoDriveId`,
    DROP COLUMN `link`,
    ADD COLUMN `caminhoArquivo` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `processos` DROP COLUMN `pastaDriveId`;
