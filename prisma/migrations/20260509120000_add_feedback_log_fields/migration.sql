-- Add event_type column to cost_log for feedback log discrimination
-- AC-1 (US-014): event_type='specialist_call' (default) / 'good' / 'bad' / 'judge_call'
ALTER TABLE "cost_log" ADD COLUMN IF NOT EXISTS "event_type" VARCHAR(32) NOT NULL DEFAULT 'specialist_call';

-- Index for PRD-8 EvolutionAgent querying feedback by event_type
CREATE INDEX IF NOT EXISTS "cost_log_event_type_created_at_idx" ON "cost_log"("event_type", "created_at" DESC);
