-- DropForeignKey
ALTER TABLE `processos` DROP FOREIGN KEY `processos_clienteId_fkey`;

-- DropIndex
DROP INDEX `processos_clienteId_fkey` ON `processos`;

-- AddForeignKey
ALTER TABLE `processos` ADD CONSTRAINT `processos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
