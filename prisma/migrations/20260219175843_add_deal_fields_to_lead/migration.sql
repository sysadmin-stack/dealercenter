-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "dealDate" TIMESTAMP(3),
ADD COLUMN     "dealDmsId" TEXT,
ADD COLUMN     "dealLender" TEXT,
ADD COLUMN     "dealMatchType" TEXT,
ADD COLUMN     "dealPrice" INTEGER,
ADD COLUMN     "dealStockNumber" TEXT,
ADD COLUMN     "dealType" TEXT,
ADD COLUMN     "dealVehicle" TEXT,
ADD COLUMN     "dealVin" TEXT;

-- CreateIndex
CREATE INDEX "leads_dealVin_idx" ON "leads"("dealVin");
