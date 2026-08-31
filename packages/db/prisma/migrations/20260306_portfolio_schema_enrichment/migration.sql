-- AlterTable: organization — add slug (required, unique) and industry
ALTER TABLE "organization" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';
ALTER TABLE "organization" ADD COLUMN "industry" TEXT;
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- AlterTable: work_experience — add highlights array
ALTER TABLE "work_experience" ADD COLUMN "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: project — add kind, role, highlights, organizationId
ALTER TABLE "project" ADD COLUMN "kind" TEXT;
ALTER TABLE "project" ADD COLUMN "role" TEXT;
ALTER TABLE "project" ADD COLUMN "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "project" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "project" ADD CONSTRAINT "project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: profile — add email, phone
ALTER TABLE "profile" ADD COLUMN "email" TEXT;
ALTER TABLE "profile" ADD COLUMN "phone" TEXT;

-- AlterTable: education — add url, gpa, courses
ALTER TABLE "education" ADD COLUMN "url" TEXT;
ALTER TABLE "education" ADD COLUMN "gpa" TEXT;
ALTER TABLE "education" ADD COLUMN "courses" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: stack_item — add level, keywords
ALTER TABLE "stack_item" ADD COLUMN "level" TEXT;
ALTER TABLE "stack_item" ADD COLUMN "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable: language
CREATE TABLE "language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fluency" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "language_name_key" ON "language"("name");
