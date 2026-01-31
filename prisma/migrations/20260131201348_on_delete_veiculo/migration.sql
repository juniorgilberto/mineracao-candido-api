-- DropForeignKey
ALTER TABLE "Veiculo" DROP CONSTRAINT "Veiculo_clientId_fkey";

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
