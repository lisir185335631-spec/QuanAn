-- Add target jsonb column to cost_log for specialist call metadata
-- AC-4 (US-003): target = '{"stepKey":"...","agentId":"..."}' for admin cost dashboard (PRD-11)
ALTER TABLE "cost_log" ADD COLUMN IF NOT EXISTS "target" JSONB;
