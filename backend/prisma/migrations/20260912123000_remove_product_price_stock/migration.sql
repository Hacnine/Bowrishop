-- Product pricing and inventory are now stored exclusively on ProductVariant.
ALTER TABLE "Product"
  DROP COLUMN "price",
  DROP COLUMN "comparePrice",
  DROP COLUMN "stock";
