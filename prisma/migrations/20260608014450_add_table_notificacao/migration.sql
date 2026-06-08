-- CreateTable
CREATE TABLE `notificacao` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('ATUALIZACAO_PROCESSO') NOT NULL,
    `descricao` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `usuarioAtorId` VARCHAR(191) NOT NULL,
    `processoId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rl_notificacao_usuario` (
    `id` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` VARCHAR(191) NOT NULL,
    `notificacaoId` VARCHAR(191) NOT NULL,

    INDEX `rl_notificacao_usuario_usuarioId_isRead_idx`(`usuarioId`, `isRead`),
    UNIQUE INDEX `rl_notificacao_usuario_usuarioId_notificacaoId_key`(`usuarioId`, `notificacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notificacao` ADD CONSTRAINT `notificacao_usuarioAtorId_fkey` FOREIGN KEY (`usuarioAtorId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacao` ADD CONSTRAINT `notificacao_processoId_fkey` FOREIGN KEY (`processoId`) REFERENCES `processos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rl_notificacao_usuario` ADD CONSTRAINT `rl_notificacao_usuario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rl_notificacao_usuario` ADD CONSTRAINT `rl_notificacao_usuario_notificacaoId_fkey` FOREIGN KEY (`notificacaoId`) REFERENCES `notificacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
