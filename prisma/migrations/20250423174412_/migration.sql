-- CreateTable
CREATE TABLE `Equipped` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Equipped_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EquippedItem` (
    `id` VARCHAR(191) NOT NULL,
    `equippedId` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,

    INDEX `EquippedItem_equippedId_idx`(`equippedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
