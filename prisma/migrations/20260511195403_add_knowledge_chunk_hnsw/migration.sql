CREATE INDEX IF NOT EXISTS knowledge_chunk_embedding_hnsw ON "knowledge_chunk" USING hnsw (embedding vector_cosine_ops);
