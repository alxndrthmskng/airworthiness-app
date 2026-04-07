# Incident Response Plan

**Status:** Draft v0.1
**Owner:** Alex King, Airworthiness Limited
**Scope:** Suspected or confirmed data breaches, privacy bugs, unauthorised access, and severe outages affecting personal data on airworthiness.org.uk
**Review cadence:** Annually, after every incident, before each social feature phase launches

---

## What counts as an incident

This plan applies if any of the following is suspected or confirmed:

- Personal data has been accessed by someone who should not have access to it
- Personal data has been disclosed to the wrong person (a leak)
- Personal data has been altered or destroyed without authorisation
- Personal data has been lost (e.g. an unrecoverable bug, accidental deletion)
- The platform has been compromised (account takeover, credential leak, code injection)
- A user has reported a privacy bug that is potentially exploitable
- A photo or post has been shared that exposes operator/customer data and the source needs to be removed urgently

If in doubt, treat it as an incident. False positives are cheap; false negatives are not.

---

## The first hour — contain

### Step 1: Confirm the issue is real
- Read the report carefully. Is it a misunderstanding, a feature working as intended, or an actual issue?
- If unsure, assume it is real until proven otherwise.

### Step 2: Stop the bleeding
- **If a single feature is affected**: flip the feature flag to disable it. The kill switch is at `/admin/feature-flags` (TODO: build this before Phase 1 ships).
- **If the whole platform is affected**: take the affected pages offline by disabling the route in Vercel, or by deploying a maintenance page.
- **If a specific user account is the source** (e.g. a leaked photo from a single user): suspend the account by setting `auth.users.banned_until` in Supabase to a date 100 years in the future. This prevents login without deleting data.
- **If a photo needs to come down urgently**: delete the row from `posts` and the file from Supabase Storage. The delete is permanent.

### Step 3: Document the timeline
Open a new file at `docs/compliance/incidents/YYYY-MM-DD-short-description.md`. Record:
- Time of detection (UTC)
- Time of containment (UTC)
- Source of the report
- What you did to contain it
- What is still unknown

This file becomes the post-mortem.

---

## Hours 1-4 — assess

Answer these questions in writing in the incident file:

1. **What data was exposed?** Be specific. "User profile data" is not enough. List the exact fields.
2. **How many users were affected?** A guess is fine; refine later.
3. **For how long was the exposure?** Best estimate.
4. **Who saw it?** Anyone identifiable? Only authenticated users? Public internet?
5. **Is the data still accessible anywhere else?** Backups, caches, third parties, screenshots, indexed by search engines?
6. **What was the root cause?** Code bug, RLS misconfiguration, human error, malicious actor?

If the answer to any of these is unknown, write "unknown — investigating" rather than guessing.

### The Article 33 threshold

If the breach is "likely to result in a risk to the rights and freedoms of natural persons" — which is a low bar — it must be reported to the ICO **within 72 hours of becoming aware of it**. Do not delay this. The 72-hour clock started at Step 1.

When in doubt, report. Under-reporting is a regulatory risk; over-reporting is not.

ICO breach reporting form: https://ico.org.uk/for-organisations/report-a-breach/

You will need:
- A description of the breach (what happened, when, how)
- The categories and approximate number of data subjects affected
- The categories and approximate number of personal data records affected
- A description of the likely consequences
- A description of the measures taken or proposed to address the breach

---

## Hours 4-12 — notify

### Notify the ICO (if Article 33 threshold met)
- Submit the breach report via the ICO online form
- Save the reference number in the incident file
- Be honest. "We don't know yet" is acceptable; lying is not.

### Notify affected users (if Article 34 threshold met)
GDPR Article 34 requires direct user notification if the breach is "likely to result in a high risk to the rights and freedoms of natural persons." For the Airworthiness platform, this includes:
- Any leak of identity data, licence data, or employment history
- Any leak of photos
- Any compromise that could affect a user's professional reputation

Notification format:
- **Direct email** to each affected user
- **In-app banner** on next login if they have not read the email
- Plain English. No legal jargon. No defensive language.

Notification content:
- What happened (one paragraph)
- What data was affected (specific list)
- What you have done to fix it (specific actions)
- What the user should do (if anything)
- How to contact you with questions
- When you will provide an update

### Template — affected user notification

> **Subject: Important — a security issue affecting your Airworthiness account**
>
> Hello [name],
>
> On [date and time], we discovered a security issue on Airworthiness that affected your account.
>
> **What happened:** [one paragraph plain English]
>
> **What data was affected:** [specific list of fields]
>
> **What we have done:** We have [specific actions]. The issue has been [contained / fixed]. We have [reported it to the ICO if applicable].
>
> **What you should do:** [specific actions, or "no action is required from you"]
>
> We are sorry this happened. If you have any questions, reply to this email or write to contact@airworthiness.org.uk. We will publish a full account of what happened and what we have changed within seven days.
>
> Alex King
> Airworthiness Limited

---

## Hours 12-24 — fix

### Root cause analysis
- What allowed the issue to happen?
- Was it a code bug, an RLS misconfiguration, a missing test, a process failure, or a third-party issue?
- Could existing tests have caught it? If not, what test would have?

### Permanent fix
- Write the fix
- Write the test that would have caught the original bug
- Run the full test suite
- Deploy via the normal process

### Re-enable the feature
- Only when confidence is high
- Notify the soft launch group first if they were affected
- Monitor closely for 24 hours after re-enabling

---

## Within 7 days — post-mortem

Publish a public post-mortem. No PII, no individual blame, full transparency about the root cause and the fix.

Post-mortem structure:
1. **What happened** — a clear factual account, timestamps included
2. **What data was affected** — precise scope
3. **Why it happened** — the technical or process failure
4. **What we did to contain it** — actions and timings
5. **What we have changed** — the permanent fix and the new safeguards
6. **What you can do** — any user-side actions
7. **How to contact us** — with questions or concerns

Publish on the website at `/incidents/YYYY-MM-DD-short-description` and link from the homepage for at least 30 days.

Update the DPIA to reflect any newly identified risks and mitigations.

---

## Backups and the right to erasure

The Supabase project is on the **Pro plan** with **7 days of daily backups**. This means:

- When a user exercises the right to erasure, their data is removed from the live database immediately
- Their data may persist in backups for up to 7 days
- After 7 days, the backups containing their data are deleted by retention rotation
- The privacy policy must state this explicitly
- Backups are stored by Supabase in the EU (project region: eu-west-1, Ireland)

If a user requests erasure and asks specifically about backups, the response is:
> "Your data has been removed from our live systems immediately. It may persist in encrypted database backups for up to 7 days, after which it is permanently deleted by automated retention rotation. The backups are not accessible to anyone except in the event of a database recovery, and are stored within the EU."

---

## Roles and responsibilities

### Solo founder (current state)
At present, Alex King is the sole person responsible for incident response. This is acceptable for a pre-launch and early-stage platform but creates a single point of failure. Risks:
- Incident detected while founder is unavailable
- 72-hour ICO clock running while founder is asleep / on holiday
- No second pair of eyes on a fix

Mitigations:
- Monitoring and alerting (TODO: set up before social feature launch)
- A trusted backup person who can flip the kill switch on instructions (TODO: identify before Phase 1)
- This document, so the founder does not have to think under pressure

### When the team grows
This section will be expanded with named roles (incident commander, comms lead, technical lead) when there is more than one person.

---

## Things to build before this plan can be executed

These are blockers — the plan does not work without them.

- [ ] **Feature flag / kill switch system** — a way to disable a feature in seconds, without a deploy
- [ ] **Admin route** to suspend a user account
- [ ] **Monitoring and alerting** — at minimum, error tracking (Sentry or similar) and uptime monitoring (Better Stack, Pingdom, etc.)
- [ ] **Audit logging** — every privacy-sensitive action logged with user, time, and what changed
- [ ] **Backup person identified** — a trusted second human who can flip the kill switch on instructions
- [ ] **Public incidents page route** at `/incidents` ready to publish post-mortems

These should ship with or before Phase 1.

---

## Things to do periodically

- **Quarterly**: re-read this plan and ask "does it still match reality?"
- **Annually**: full review of the DPIA and this plan
- **Before each phase launch**: re-read both documents
- **After every incident**: update the plan with lessons learned

---

## Quick reference card

Print this and keep it visible:

> **An incident has happened. What do I do?**
>
> 1. Confirm it's real
> 2. Flip the kill switch
> 3. Write down what time it is
> 4. Open the incident file
> 5. Within 4 hours: assess scope
> 6. Within 72 hours: report to the ICO if needed
> 7. Within 24 hours: notify affected users
> 8. Within 24 hours: fix the root cause
> 9. Within 7 days: publish the post-mortem
>
> When in doubt: contain first, ask questions later.
