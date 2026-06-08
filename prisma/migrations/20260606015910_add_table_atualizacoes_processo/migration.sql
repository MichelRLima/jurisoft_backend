-- CreateTable
CREATE TABLE `atualizacoesProcesso` (
    `id` VARCHAR(191) NOT NULL,
    `processoId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `statusId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `atualizacoesProcesso` ADD CONSTRAINT `atualizacoesProcesso_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `statusProcesso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `atualizacoesProcesso` ADD CONSTRAINT `atualizacoesProcesso_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `atualizacoesProcesso` ADD CONSTRAINT `atualizacoesProcesso_processoId_fkey` FOREIGN KEY (`processoId`) REFERENCES `processos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
