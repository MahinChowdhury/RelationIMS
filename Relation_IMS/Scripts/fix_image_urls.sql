-- Fix image URLs in Products table (simpler approach)
UPDATE "Products"
SET "ImageUrls" = ("ImageUrls"::text REPLACE 'http://localhost:9000/product-images/' '/storage/product-images/')::jsonb
WHERE "ImageUrls" IS NOT NULL 
  AND "ImageUrls"::text LIKE '%localhost:9000%';

UPDATE "Products"
SET "ThumbnailUrl" = REPLACE("ThumbnailUrl", 'http://localhost:9000/product-images/', '/storage/product-images/')
WHERE "ThumbnailUrl" IS NOT NULL 
  AND "ThumbnailUrl" LIKE '%localhost:9000%';

-- Fix image URLs in ProductItems table
UPDATE "ProductItems"
SET "ImageUrl" = REPLACE("ImageUrl", 'http://localhost:9000/product-images/', '/storage/product-images/')
WHERE "ImageUrl" IS NOT NULL 
  AND "ImageUrl" LIKE '%localhost:9000%';

-- Fix image URLs in ProductVariants table
UPDATE "ProductVariants"
SET "ImageUrl" = REPLACE("ImageUrl", 'http://localhost:9000/product-images/', '/storage/product-images/')
WHERE "ImageUrl" IS NOT NULL 
  AND "ImageUrl" LIKE '%localhost:9000%';

-- Fix image URLs in Customers table
UPDATE "Customers"
SET "ImageUrl" = REPLACE("ImageUrl", 'http://localhost:9000/', '/storage/')
WHERE "ImageUrl" IS NOT NULL 
  AND "ImageUrl" LIKE '%localhost:9000%';

-- Fix image URLs in Brands table
UPDATE "Brands"
SET "ImageUrl" = REPLACE("ImageUrl", 'http://localhost:9000/', '/storage/')
WHERE "ImageUrl" IS NOT NULL 
  AND "ImageUrl" LIKE '%localhost:9000%';
