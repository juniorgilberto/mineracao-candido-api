/*
  Warnings:

  - The values [PF,PJ] on the enum `ClientType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `ie` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Client` table. All the data in the column will be lost.
  - The `id` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vehicle` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nome` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDENTE', 'EM_FECHAMENTO', 'PAGO');

-- AlterEnum
BEGIN;
CREATE TYPE "ClientType_new" AS ENUM ('PESSOA_FISICA', 'PESSOA_JURIDICA');
ALTER TABLE "Client" ALTER COLUMN "type" TYPE "ClientType_new" USING ("type"::text::"ClientType_new");
ALTER TYPE "ClientType" RENAME TO "ClientType_old";
ALTER TYPE "ClientType_new" RENAME TO "ClientType";
DROP TYPE "public"."ClientType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_materialId_fkey";

-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_clientId_fkey";

-- DropIndex
DROP INDEX "Client_name_idx";

-- AlterTable
ALTER TABLE "Client" DROP CONSTRAINT "Client_pkey",
DROP COLUMN "address",
DROP COLUMN "ie",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "inscricaoEstadual" TEXT,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Material";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "Usuario";

-- DropTable
DROP TABLE "Vehicle";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" SERIAL NOT NULL,
    "placa" TEXT NOT NULL,
    "metragem" DOUBLE PRECISION NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "valor_m3" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "produtoId" INTEGER,
    "produto_valor" DECIMAL(12,2) NOT NULL,
    "veiculoId" INTEGER,
    "metragem" DOUBLE PRECISION NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "data_do_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDENTE',
    "fechamentoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fechamento" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fechamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_fechamentoId_fkey" FOREIGN KEY ("fechamentoId") REFERENCES "Fechamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
