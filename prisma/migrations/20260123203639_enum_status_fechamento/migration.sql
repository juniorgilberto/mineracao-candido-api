/*
  Warnings:

  - The `status` column on the `Fechamento` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FechamentoStatus" AS ENUM ('PENDENTE', 'PAGO');

-- AlterTable
ALTER TABLE "Fechamento" DROP COLUMN "status",
ADD COLUMN     "status" "FechamentoStatus" NOT NULL DEFAULT 'PENDENTE';
