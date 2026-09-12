-- Product pricing and inventory are now stored exclusively on ProductVariant.
ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "price",
  DROP COLUMN IF EXISTS "comparePrice",
  DROP COLUMN IF EXISTS "stock";
