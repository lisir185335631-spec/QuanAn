-- PRD-9 US-002 AC-2: unique constraint for upsert by (type, title)
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_chunk_type_title_key" ON "knowledge_chunk"("type", "title");
