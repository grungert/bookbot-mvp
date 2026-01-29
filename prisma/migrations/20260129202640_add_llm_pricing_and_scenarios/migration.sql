-- CreateTable
CREATE TABLE "LLMModelPricing" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "inputPricePer1M" DECIMAL(10,4) NOT NULL,
    "outputPricePer1M" DECIMAL(10,4) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMModelPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LLMModelPricing_isActive_idx" ON "LLMModelPricing"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LLMModelPricing_provider_modelName_key" ON "LLMModelPricing"("provider", "modelName");

-- CreateIndex
CREATE INDEX "PricingScenario_createdBy_idx" ON "PricingScenario"("createdBy");

-- AddForeignKey
ALTER TABLE "PricingScenario" ADD CONSTRAINT "PricingScenario_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
