-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_clientId_fkey";

-- AlterTable
ALTER TABLE "Pedido" ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
