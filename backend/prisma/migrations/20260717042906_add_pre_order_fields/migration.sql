-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "isPreOrder" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isPreOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preOrderDate" TIMESTAMP(3),
ADD COLUMN     "preOrderNote" TEXT;
