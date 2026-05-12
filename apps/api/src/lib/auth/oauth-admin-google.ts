// PRD-10 US-002 · Google Workspace OAuth stub (prod-only · PRR required)
// AC-4: throws config error with required env vars listed
// Real impl deferred to PRR (GOOGLE_WORKSPACE_CLIENT_ID/SECRET/REDIRECT_URI/HD/WHITELIST_EMAILS)

export function googleWorkspaceOAuthStub(): never {
  throw new Error(
    'PRR config required · GOOGLE_WORKSPACE_CLIENT_ID/SECRET/REDIRECT_URI/HD/WHITELIST_EMAILS',
  );
}
