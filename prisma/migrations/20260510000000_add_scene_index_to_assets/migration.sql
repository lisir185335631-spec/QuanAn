-- PRD-6 US-001 · Asset 表加 sceneIndex + 复合索引
-- scene_index: storyboard 第几个镜头(1-based · NULL 时非 scene image)

ALTER TABLE "assets" ADD COLUMN "scene_index" INTEGER;

CREATE INDEX "assets_account_id_related_step_key_scene_index_idx"
ON "assets"("account_id", "related_step_key", "scene_index");
