-- DropIndex
DROP INDEX IF EXISTS "ProductVariant_productId_color_size_key";

-- CreateIndex - Partial unique index that only enforces uniqueness when color OR size is NOT null
-- This allows multiple variants with null color/size for the same product
CREATE UNIQUE INDEX "ProductVariant_productId_color_size_partial_idx" 
ON "ProductVariant" ("productId", "color", "size") 
WHERE "color" IS NOT NULL OR "size" IS NOT NULL;
