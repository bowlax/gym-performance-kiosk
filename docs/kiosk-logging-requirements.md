# Kiosk logging requirements

A shared iPad at Wolf logs a member's best set. An owner signs the kiosk in once. A member picks their name, logs one set per exercise, and confirms that log from the email on their own device. Nothing is a live session until that click.

## Hard requirements

### Kiosk auth

The kiosk reuses the owner UI human login: the Auth email and that user's secret, checked with GoTrue's password grant. It does not use the passwordless owner-API session. The kiosk session is indefinite. There is no daily re-auth.

### Name picker

The picker shows only members with a resolved real name.

### One set per exercise

The kiosk form allows one set per exercise, the same rule as the shipped iOS and member web log. It is not the old multi-set form.

### Pending state

A submitted log is written to a genuinely invisible pending state. That state is a separate table, not a flag on live rows. Invisibility holds by construction: the board, progression, PB derivation (current and lifetime), sync pull, and every owner view read the live tables and never this one.

Until the confirm click, the log is absent from:

- the member's board
- their progression
- PB derivation, current and lifetime
- owner current PBs
- owner PB frequency
- any raw-fact owner view
- a sync pull to another device

### No expiry

An unconfirmed entry does not expire. There is no timeout, no TTL, and no cleanup job. It stays unconfirmed until the member commits it.

### The only commit path

The only commit path is the member clicking the confirm link in their own email, on their own device. There is no review page and no second step. There is no bypass that writes a live session from the kiosk.

## Verified on Wolf, 24 Sep 2026

Checked against project `ivrsxhuktebvypgtfoww`, not against a description of the code.

The pending table is `public.kiosk_pending_sessions`. The only function that copies a pending row into `sessions`, `exercise_entries`, and `sets`, then deletes that row, is `commit_kiosk_pending`. `sessions` has no pending or status column.

Row-level security is on. No policy grants `SELECT`. `anon` and `authenticated` both lack `SELECT` on `kiosk_pending_sessions`. Anon `GET /rest/v1/kiosk_pending_sessions` returns `401` / `42501` (permission denied). Owners may insert and delete rows for their own gym. That is how the kiosk stores a pending log.

A real pending row from 24 Sep 2026, `6b13edb2-967f-4ce0-8b57-57d67589fe49` (payload session `881b669c-4c05-408f-b76b-3b1059236833`), was still unconfirmed hours after insert. Postgres counts, which bypass RLS, were zero in `sessions`, `exercise_entries`, `sets`, `personal_bests`, `owner_session_activity`, and `owner_set_detail`. Sync pull reads those live tables, so it has nothing to return for that log. PB derivation reads `exercise_entries` joined to `sessions`, plus manual `personal_bests`. Both inputs were empty for that session. `commit_kiosk_pending` does not insert `personal_bests`.

The table has `created_at` and no `expires_at`. There is no user trigger on it, and Wolf has no `pg_cron` extension. `commit_kiosk_pending` does not consult `created_at`.

The confirm link opens the member web app at `/kiosk/confirm`. The kiosk host does not serve that route. A signed-in member's browser hashes the token and calls `commit_kiosk_pending` immediately. The page does not list the sets and has no second confirm button. If the member is signed out, TeamUp sign-in is required first, then that same call runs. Anon cannot execute the function. Replaying a used token returns 404 because the pending row is already gone.

Two confirms on 24 Sep 2026 did insert live sessions at the RPC timestamp (`ffcbb49e-eb5f-49ab-86cc-f672b417ff97` at 12:36:25 UTC, `bd2e391d-6b00-4b35-b177-5754f1d8d1df` at 12:56:13 UTC from Safari). Both sessions, their entries, and their sets were soft-deleted shortly afterwards (12:38:20 UTC and 12:56:36 UTC). A board read that skips `deleted_at` does not show them now. The unconfirmed session `881b669c` was never a row in `sessions`.

Kiosk sign-in is `grant_type=password` with the owner email and secret. The cookie is `gp_kiosk`, max age 400 days, rewritten as the refresh token slides the access token. Owner Auth sessions on Wolf have `not_after` null. The oldest of those sessions was created 11 Sep 2026.

The picker keeps a member only when `deleted_at` is null, `display_name` is a real name (the placeholder `Member` is excluded), and both `teamup_email` and `teamup_roster_id` are set. On 24 Sep 2026: 21 active members, 14 matched, 7 had an auth user and an unresolved name and were omitted, and 0 had a resolved name with `auth_user_id` empty.

The submitted payload and `commit_kiosk_pending` both require exactly one set per exercise.

## Resolved name while the phone is disconnected

This is intentional.

"Currently connected" is only a flag on the phone (`MemberConnectionStore`). Disconnect does not clear `display_name`, `teamup_email`, `teamup_roster_id`, or `auth_user_id`, and it does not set `deleted_at`. There is no cloud column for "connected".

A resolved name and a disconnected phone can both be true. The picker still lists that member. A confirmed log is stored on that `member_id`. The phone shows it after they reconnect and sync.
