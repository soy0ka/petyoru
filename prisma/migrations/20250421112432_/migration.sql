-- DropForeignKey
ALTER TABLE `Session` DROP FOREIGN KEY `Session_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserPats` DROP FOREIGN KEY `UserPats_userId_fkey`;

-- CreateTable
CREATE TABLE `YoruEnhance` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `exp` INTEGER NOT NULL DEFAULT 0,
    `failCount` INTEGER NOT NULL DEFAULT 0,
    `successRate` INTEGER NOT NULL DEFAULT 90,

    UNIQUE INDEX `YoruEnhance_userId_key`(`userId`),
    INDEX `YoruEnhance_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `UserPats_userId_idx` ON `UserPats`(`userId`);

-- RedefineIndex
CREATE INDEX `Account_userId_idx` ON `Account`(`userId`);

-- RedefineIndex
CREATE INDEX `Session_userId_idx` ON `Session`(`userId`);
