-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "saldo" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Fechamento" ADD COLUMN     "clientId" INTEGER;

-- AddForeignKey
ALTER TABLE "Fechamento" ADD CONSTRAINT "Fechamento_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
