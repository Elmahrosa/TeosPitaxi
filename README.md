# TeosPitaxi — Pi-Native Mobility dApp (Cleanup Pack)

This patch contains a set of fixes and recommended files to secure and modernize the TeosPitaxi repo.

## Included
- .github/workflows/ci.yml
- .env.example
- .gitignore
- package.json.snippet (scripts + engines)
- app/api/rides/create/action.ts (secure server action example)
- supabase/sql/rls.sql (RLS policies sample)
- LICENSE (MIT)
- CONTRIBUTING.md
- README_CHANGELOG.md (notes)

## How to apply
1. **Remove** any file named `.github` in the repository root if it is a **file** (not a folder).
2. Upload the contents of this ZIP to your repository root (you can upload via GitHub web UI → Add file → Upload files).
3. Commit changes to `main` (or create a branch + PR).
4. Verify GitHub Actions runs: Actions → CI.
5. Add secrets in repo settings for PROD keys (do not commit them):
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - PI_API_KEY
6. Test locally: `pnpm install && pnpm dev`

## Security notes (important)
- **Never** create a Supabase client with service role key on the client side.
- Use server actions, edge functions, or API routes for admin operations.
- Keep `SUPABASE_SERVICE_ROLE_KEY` in GitHub Secrets and only reference within workflows or server-side code.
