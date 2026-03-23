UPDATE "Products" SET "ImageUrls" = array(SELECT regexp_replace(unnest("ImageUrls"), '^http://localhost:9000', '')) WHERE "ImageUrls"::text LIKE '%http://localhost:9000%';
UPDATE "Products" SET "ThumbnailUrl" = regexp_replace("ThumbnailUrl", '^http://localhost:9000', '') WHERE "ThumbnailUrl" LIKE 'http://localhost:9000%';
SELECT "Id", "Name", "ImageUrls", "ThumbnailUrl" FROM "Products" ORDER BY "Id" DESC LIMIT 5;
