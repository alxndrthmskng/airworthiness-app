# Phase 3 — Milestone Feed

**Status:** Draft spec
**Scope:** Auto-generated chronological feed of milestone posts from followed engineers.
**Risk profile:** Medium. First user-visible feed content. Tone is set here.

---

## What ships in Phase 3

1. A `posts` table for storing structured post data
2. The `/feed` page rendering posts chronologically from followed users + the current user's own posts
3. Auto-generated post types from existing data: module passes, type ratings, training completions
4. A "Share to feed" API that takes a structured milestone reference and creates a post row
5. Integration with existing flows: when a user saves a passing module result (or similar milestone), they see a one-tap share prompt
6. Empty state when there are no posts to show
7. The whole feature gated behind the `social_feed` feature flag

## What does NOT ship in Phase 3

- No photos (Phase 4)
- No 140-char technical notes (Phase 4)
- No task posts from logbook entries (Phase 4)
- No comments, kudos, reactions
- No reposting / quote-reposting
- No notifications
- No algorithmic ranking — chronological only
- No back-fill of historical milestones (data captured before Phase 3 will not retroactively become posts)

---

## Data model

### `posts` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `author_id` | uuid | FK `auth.users` ON DELETE CASCADE |
| `post_type` | text | `module_pass`, `type_rating_added`, `training_completed`, etc. |
| `data` | jsonb | Type-specific structured payload |
| `visibility` | text | `followers` (default) or `public` |
| `created_at` | timestamptz | Server timestamp; this is the chronological key |

`data` payload examples:

```json
{ "module_id": "7A", "category": "B1.1", "mcq_score": 92, "essay_score": 88 }
{ "rating": "A320" }
{ "training_slug": "human-factors", "completion_date": "2026-04-07" }
```

The schema is not enforced at the database level — it's the application's job to validate the payload before insert. This keeps the database flexible as new post types are added.

### RLS

- **SELECT**: a user can read posts where the author is in their `follows` (status='active') OR the author is themselves OR the post visibility is `public` AND the author has a public profile
- **INSERT**: a user can insert their own posts (`author_id = auth.uid()`)
- **UPDATE**: forbidden — posts are immutable
- **DELETE**: a user can delete their own posts

### Helper function

`get_feed(p_limit int, p_before timestamptz)` — security definer function that returns the feed for the current user, joined with the author's public profile data needed to render the post card. Pagination via `p_before` cursor.

---

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/posts/share-milestone` | POST | Creates a new milestone post for the current user. Body: `{ post_type, data }`. Validates the payload. |
| `/api/posts/[id]` | DELETE | Deletes a post. Only the author can delete their own posts. |

---

## Pages

### `/feed`

- Server-rendered page
- If `social_feed` flag is off → "Coming soon" placeholder (already exists from earlier slice)
- If on but no posts → empty state ("Follow some engineers to see their milestones here")
- Otherwise → chronological list of post cards

### Post card design

- Avatar + display name + handle (links to `/u/handle`)
- Relative time ("2 hours ago", "yesterday", "3 weeks ago")
- Type-specific body (see below)
- No actions (no kudos, no comments, no share — this is read-only in Phase 3)

### Card body per type

**Module pass:**
> Passed Module 7A — Maintenance Practices (B1.1)
> MCQ 92% · Essay 88%

**Type rating added:**
> New type rating: A320

**Training completed:**
> Completed Human Factors training

---

## Milestone integration

This is the auto-share prompt described in the original spec. The user is offered a one-tap share when they save a milestone, but never auto-shared without consent.

For Phase 3 we wire it into:

1. **Module exam progress save** — when the user saves a result that meets the pass mark, show a prompt: "Share this pass to your feed?"
2. **Type rating endorsement** — when a new type rating is added in the profile, prompt to share
3. **Continuation training** — when a training cert is uploaded with a current date, prompt to share

Each prompt is a small modal/banner that appears next to the save action. The user can tap "Share" or "Not now". Tapping "Share" calls `/api/posts/share-milestone` with the relevant payload.

---

## Tests required

- Cannot insert post for another user (RLS)
- Cannot read posts from non-followed user (RLS) — unless visibility=public
- Can read own posts always
- Can read followed user's posts
- Cannot update posts (RLS)
- Can delete own posts
- Cascade delete: deleting user removes their posts
- Feed query returns posts in correct order

---

## Definition of done

- [ ] Migration applied with table, RLS, and helper function
- [ ] Tests passing
- [ ] /feed page renders correctly for empty and populated states
- [ ] Share API validates payloads
- [ ] At least one post type wired into an existing save flow
- [ ] Privacy policy updated for Phase 3 (already drafted)
- [ ] DPIA reviewed for Phase 3 risks
