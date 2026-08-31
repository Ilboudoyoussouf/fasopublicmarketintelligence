-- AddForeignKey
ALTER TABLE "PpmItem" ADD CONSTRAINT "PpmItem_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
