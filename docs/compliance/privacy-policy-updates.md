# Privacy Policy — Updates Required Before Each Phase

**Status:** Draft v0.1
**Owner:** Alex King, Airworthiness Limited
**Source:** `app/(public)/privacy/page.tsx`

This document tracks the privacy policy changes required before each phase of the social feature launches. The current policy (last updated 28 March 2026) does not cover the social feature; updates are versioned per phase.

---

## Pre-Phase 1 — Foundational corrections

These should ship **before** any social feature work begins, because they fix gaps in the current policy regardless of the social rollout.

### Change 1 — Correct the data storage location

**Current text (Section 5):**
> Your data is stored securely using Supabase (hosted within the EU/EEA) with encryption at rest and in transit.

**Proposed text:**
> Your data is stored securely using Supabase, hosted in Ireland (eu-west-1), with encryption at rest and in transit. File uploads are stored in Supabase Storage in the same region with row-level security policies.

**Why:** The current text is accurate but vague. "EU/EEA" is correct but the specific country and region are useful for data subject access requests and for operator due diligence.

### Change 2 — Be explicit about backups and the right to erasure

**Current text (Section 5):**
> We retain your personal data for as long as your account is active. If you delete your account, your data will be permanently removed within 30 days, except where retention is required by law.

**Proposed text:**
> We retain your personal data for as long as your account is active. When you delete your account, your data is removed from our live systems immediately. Encrypted backups of the database are retained for 7 days as part of our disaster recovery process; your data may persist in these backups until they are rotated out, after which it is permanently deleted. Backups are stored within the EU and are not accessed except in the event of a database recovery.

**Why:** The current 30-day figure does not match the actual technical reality (Supabase Pro plan: 7 days of daily backups). GDPR requires accuracy here. The correction is also more favourable to the user (immediate live deletion + 7 days backup, rather than "up to 30 days").

### Change 3 — Add ICO registration confirmation

**Insert as new Section 1.1, immediately after the existing Section 1:**

> **1.1 ICO Registration**
>
> Airworthiness Limited is registered with the Information Commissioner's Office as a data controller. Our registration number is [TODO — pending registration]. You can verify our registration on the ICO public register at [ico.org.uk/esdwebpages/search](https://ico.org.uk/esdwebpages/search).

**Action required before launch:** Register Airworthiness Limited with the ICO and pay the data protection fee. The fee is currently £40-£60 per year for Tier 1 organisations (turnover ≤ £632,000 and ≤ 10 staff). Register at https://ico.org.uk/for-organisations/data-protection-fee/register/.

---

## Pre-Phase 1 — Social feature additions

These changes ship at the same time as Phase 1 (the public profile page).

### Change 4 — Add social feature data category

**Insert into Section 2 (Data We Collect), as a new bullet:**

> - **Public profile data (optional):** if you choose to enable a public profile, we process the following data for the purpose of displaying it: a public handle of your choice, your display name, an optional public profile photo (separate from your licence photo), the type ratings and licence categories you hold, and any optional sections you choose to enable (employment status label, years in industry, apprenticeship completion, continuation training currency status). You may disable your public profile at any time, and the page will become inaccessible immediately.

### Change 5 — Add social feature usage purpose

**Insert into Section 3 (How We Use Your Data), as a new bullet:**

> - To display your public professional profile to other users and to the public, **only if you have explicitly enabled this feature**. The public profile is opt-in and disabled by default. You may opt out at any time.

### Change 6 — Clarify the lawful basis for the social feature

**Insert into Section 4 (Lawful Basis for Processing), as a new sub-bullet under Consent:**

> - **Consent (specific to social features):** processing of your data for the public profile, follower relationships, and feed (each enabled separately) is based on explicit, granular consent. You can withdraw consent for any social feature at any time, and your data will be removed from public view immediately. The core licence tracking, logbook, and training services do not require any social consent.

### Change 7 — New Section 11: Social Features

**Insert as a new section, immediately before "Cookies":**

> **11. Social Features**
>
> Airworthiness offers optional social features that allow you to share your professional achievements with other engineers. These features are entirely opt-in and disabled by default. The core platform — licence tracking, digital logbook, training management — works fully without enabling any social feature.
>
> **What is shared when you enable a public profile:** your handle, display name, optional profile photo, type ratings, licence categories, and any optional sections you choose to enable. Your profile becomes viewable at airworthiness.org.uk/u/[your-handle].
>
> **What is never shared, even with a public profile:** your licence number, date of birth, employer, customer or operator names, logbook entries, exam scores, contact details, and your private licence photograph.
>
> **You are in control:**
> - You choose whether to enable a public profile
> - You choose your handle
> - You choose which optional sections to display
> - You can disable your public profile at any time, with immediate effect
> - You can delete your account at any time, which removes all data including any public profile
>
> **Consent and withdrawal:** Enabling a public profile is an explicit, separate consent action. You will be shown exactly what will be shared before you confirm. You can withdraw consent at any time from the Settings page. Withdrawal takes effect immediately on our live systems; backups will rotate out within 7 days.

### Change 8 — Update the "Last updated" date

Change `Last updated: 28 March 2026` to the date of the Phase 1 launch.

---

## Pre-Phase 2 — Follow graph additions

When Phase 2 launches, the following additions will be needed.

### Change 9 — Add follower data category

**Insert into Section 2 (Data We Collect):**

> - **Follower relationships (optional):** if you choose to follow other users or accept follower requests, we process the resulting graph of relationships for the purpose of displaying follower and following lists on profile pages.

### Change 10 — Update Section 11 to cover follows

**Append to Section 11:**

> **Follower relationships (Phase 2):** Once enabled, you can follow other engineers and they can follow you. Follow relationships are visible on profile pages by default. If your profile is private, follow requests must be approved by you. You can unfollow or block any user at any time. Blocking is mutual — neither party can see each other's profile.

---

## Pre-Phase 3 — Milestone feed additions

When Phase 3 launches, the following additions will be needed.

### Change 11 — Add feed post data category

**Insert into Section 2 (Data We Collect):**

> - **Milestone posts (optional):** if you choose to enable feed sharing, we generate posts from milestones you achieve on the platform (module passes, type rating endorsements, training completions, anniversaries). These posts are auto-generated from your existing data; we do not capture new personal data for the feed itself. You choose whether each milestone is shared, on a per-event basis.

### Change 12 — Update Section 11 to cover the feed

**Append to Section 11:**

> **Milestone feed (Phase 3):** Once enabled, you will be prompted to share milestones (such as passing a module exam or completing a type course) when they happen. Each prompt is opt-in. Posts are auto-generated from structured data — we do not allow free-form text in posts. Posts are visible only to your followers (or to the public if your profile is public). You can delete any of your posts at any time.

---

## Pre-Phase 4 — Task posts and photos

When Phase 4 launches, the following additions will be needed.

### Change 13 — Add task post data category

**Insert into Section 2 (Data We Collect):**

> - **Task share posts (optional):** if you choose to share a logbook entry to your feed, we display structured data from that entry (aircraft type, ATA chapter, task type, licence category, date) along with any photos and a short technical note (up to 140 characters) you add. Sharing is per-entry and never automatic.

### Change 14 — Photos

**Insert into Section 2 (Data We Collect):**

> - **Photos attached to posts (optional):** photographs you upload to attach to feed posts. You are responsible for the content of photographs you upload. We strip metadata (including GPS coordinates) from uploaded photos before storage. Photos are stored in Supabase Storage and served via short-lived signed URLs. You can delete any post (including its photos) at any time.

### Change 15 — Update Section 11 to cover task posts

**Append to Section 11:**

> **Task posts (Phase 4):** Once enabled, you can share individual logbook entries to your feed. Sharing is opt-in for each entry; we do not auto-share any logbook data. You can attach photos and a short technical note (up to 140 characters). You are responsible for the content of photos you upload — we recommend you do not include identifying information about operators, customers, or third parties. You can delete any post at any time.

---

## Required acknowledgement before launch

Before each phase launches:

1. The privacy policy is updated with the relevant changes from this document
2. Existing users see an in-app banner notifying them of the change
3. The banner links to the updated privacy policy and a clear changelog
4. The user must dismiss the banner before continuing to use the app
5. New users see the updated policy as part of the signup flow
6. The acknowledgement event is logged with timestamp and user id

---

## Open items

1. **ICO registration number** — needed for Change 3. Register first, then update the policy with the actual reference.
2. **Solicitor review** — Changes 1-8 should ideally be reviewed by a UK privacy solicitor before going live. Self-drafting is acceptable for a pre-launch platform but increases risk.
3. **Cookie policy update** — out of scope of this document, but the existing cookie policy should be reviewed at the same time to make sure it covers any new third-party services added by the social feature (none planned in Phase 1).
