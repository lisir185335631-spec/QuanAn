/*
  Warnings:

  - Made the column `mode` on table `prompt_canary_config` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mode` on table `prompt_versions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "prompt_canary_config" ALTER COLUMN "mode" SET NOT NULL,
ALTER COLUMN "mode" SET DEFAULT 'default',
ALTER COLUMN "strategy" SET DEFAULT 'user_id_hash';

-- AlterTable
ALTER TABLE "prompt_versions" ALTER COLUMN "mode" SET NOT NULL,
ALTER COLUMN "mode" SET DEFAULT 'default';
