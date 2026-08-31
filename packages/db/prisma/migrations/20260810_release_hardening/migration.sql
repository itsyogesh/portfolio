-- The enrichment migration used an empty-string default to add a required
-- organization slug. Keep the applied migration immutable, then remove that
-- temporary database default so future inserts must provide a real slug.
ALTER TABLE "organization" ALTER COLUMN "slug" DROP DEFAULT;
