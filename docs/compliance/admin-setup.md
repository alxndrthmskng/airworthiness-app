# Admin Setup

The admin role gates access to `/admin/*` routes including the feature flag kill switches. There is no UI for granting admin — it is intentionally a manual operation done in the Supabase SQL editor.

## Granting admin to the founder (one-time setup)

After signing up for the first time as alxndrthmskng@gmail.com, run this in the Supabase SQL editor:

```sql
INSERT INTO public.admins (user_id, granted_at, granted_by)
SELECT id, now(), id
FROM auth.users
WHERE email = 'alxndrthmskng@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
```

This grants admin to whichever account is signed up under that email. It is idempotent — running it twice is safe.

## Verifying admin access

After granting, navigate to `/admin/feature-flags`. You should see the feature flag list. If you are redirected to `/dashboard`, the grant did not work — check the email matches and the row exists in `public.admins`.

## Granting admin to a second person (later)

Replace the email and run the same query. There is no role hierarchy — admins are flat. Every admin can toggle every flag.

## Revoking admin

```sql
DELETE FROM public.admins
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'someone@example.com');
```

## Why no UI for this?

Admin grants are a high-risk operation. A bug or compromised account could grant admin to anyone. By keeping it as a manual SQL operation, we ensure:

- Every grant is intentional
- Every grant is performed by someone with database access
- There is no API surface to attack
- The audit trail lives in Postgres logs, not application logs

This will be revisited when there are more than three admins.
