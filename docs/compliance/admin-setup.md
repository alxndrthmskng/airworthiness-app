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

---

## Soft launch — feature flag allowlists

Some feature flags can be in **soft launch mode**: enabled, but only visible to a specific list of users. This is the recommended way to roll out new features (per the rollout plan).

### Semantics

- **Allowlist empty + flag enabled** → ON for everyone (full launch)
- **Allowlist set + flag enabled** → ON for allowlist members only (soft launch)
- **Allowlist anything + flag disabled** → OFF for everyone (kill switch)

The kill switch always wins. Disabling the flag in `/admin/feature-flags` immediately turns the feature off for everyone, allowlist or not.

### Adding a user to the soft launch group

```sql
INSERT INTO public.feature_flag_allowlist (flag_key, user_id, added_by)
SELECT 'social_profile', u.id, (SELECT id FROM auth.users WHERE email = 'alxndrthmskng@gmail.com')
FROM auth.users u
WHERE u.email = 'their-email@example.com'
ON CONFLICT (flag_key, user_id) DO NOTHING;
```

Replace `social_profile` with the flag key and `their-email@example.com` with the user's email.

### Removing a user from the soft launch group

```sql
DELETE FROM public.feature_flag_allowlist
WHERE flag_key = 'social_profile'
  AND user_id = (SELECT id FROM auth.users WHERE email = 'their-email@example.com');
```

### Checking who is in the allowlist

```sql
SELECT a.flag_key, u.email, a.added_at
FROM public.feature_flag_allowlist a
JOIN auth.users u ON u.id = a.user_id
WHERE a.flag_key = 'social_profile'
ORDER BY a.added_at;
```

### Promoting from soft launch to full launch

When ready to roll out to everyone, just empty the allowlist:

```sql
DELETE FROM public.feature_flag_allowlist WHERE flag_key = 'social_profile';
```

The flag remains enabled, but the empty allowlist now means "everyone."

### Kill switch during soft launch

Same as always: go to `/admin/feature-flags` and toggle the flag off. Works regardless of the allowlist state.
