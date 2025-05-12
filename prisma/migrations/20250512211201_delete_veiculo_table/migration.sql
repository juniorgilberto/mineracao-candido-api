/*
  Warnings:

  - You are about to drop the column `veiculoId` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `usuario` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `Veiculo` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_veiculoId_fkey";

-- DropForeignKey
ALTER TABLE "Veiculo" DROP CONSTRAINT "Veiculo_clienteId_fkey";

-- DropIndex
DROP INDEX "Usuario_usuario_key";

-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "veiculoId",
ADD COLUMN     "veiculo" TEXT;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "usuario",
ADD COLUMN     "email" TEXT NOT NULL;

-- DropTable
DROP TABLE "Veiculo";

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
