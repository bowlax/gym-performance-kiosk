# Gym performance kiosk

Shared iPad at Wolf. An owner signs in once. A member picks their name, logs one set per exercise, and confirms the log from the email on their own device. Nothing is a live session until that click.

This app used to live on a branch of `gym-performance-system` (pull request 44). It is its own repository now. Member data is not in this tree.

The running save path is PostgREST (`kiosk_pending_sessions` and `commit_kiosk_pending` in `supabase/migrations`). Apply that migration on the Wolf project before save can succeed. `SESSION_SECRET` and `RESEND_API_KEY` are Worker secrets, not files in git.

`supabase/functions/kiosk-log` is the earlier edge-function draft. The kiosk no longer calls it. That draft still imports member-edge helpers that stay in `gym-performance-system`.
