## Patch notes - Full cleanup

- Added .github/workflows/ci.yml to run CI on push/PR.
- Added .env.example and .gitignore to prevent secret leaks.
- Added secure server action example to move service-role operations server-side.
- Added Supabase RLS SQL sample.
- Added package.json snippet for scripts + engines.
- Added LICENSE (MIT) and CONTRIBUTING guidelines.
# 📜 Changelog — TeosPitaxi

This file tracks major changes, migrations, and architecture decisions for the **TeosPitaxi** project.  
Follow semantic versioning (`MAJOR.MINOR.PATCH`) when updating.

---

## v1.0.0 — Initial Release
- Added **README.md** with full project overview
- Created `.env.example` with safe placeholders
- Added `.github/workflows/ci.yml` for CI/CD with pnpm + Next.js
- Added `CONTRIBUTING.md` with workflow and commit conventions
- Established **MIT License**

---

## v1.1.0 — Security & Governance
- Strengthened **Supabase RLS policies** for rides table
- Added `SUPABASE_JWT_SECRET` to `.env.example`
- Updated README with `.env.local` warning
- Added commit message rules (Conventional Commits) in CONTRIBUTING.md

---

## v1.2.0 — Developer Experience
- Added pnpm caching in CI workflow
- Enforced Node.js + pnpm versions via `package.json` engines field
- Improved README with Prettier formatting instructions
- Added `.gitignore` to exclude secrets, build artifacts, and caches

---

## v1.3.0 — Roadmap
- Planned integration of **driver verification & ratings**
- Future addition: **Escrow-based payment safety** with Pi SDK
- Next milestone: **TEOS Treasury wallet integration**

---

## 🔮 Upcoming
- Expand Supabase schema for ride history and ratings
- Add governance dashboards for TEOS ecosystem integration
- Prepare deployment scripts for Vercel + Pi SDK production rollout
